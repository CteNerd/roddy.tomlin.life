import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { App } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import type { AssetManifest } from "aws-cdk-lib/cloud-assembly-schema";
import { configuration } from "./config.ts";
import { EventingStack } from "./eventing.ts";
import { ReleasePlanningStack, releaseAssetsBucketName } from "./release-planning.ts";
import { FounderStack } from "./stack.ts";

for (const environment of ["development", "production"] as const) {
  test(`${environment} release planning has exact OIDC trust, isolated assets and no execution authority`, () => {
    const config = configuration(environment, "123456789012");
    const template = Template.fromStack(new ReleasePlanningStack(new App(), config));
    template.resourceCountIs("AWS::IAM::OIDCProvider", 0);
    template.resourceCountIs("AWS::IAM::Role", 2);
    template.resourceCountIs("AWS::S3::Bucket", 1);
    for (const type of ["AWS::DynamoDB::Table", "AWS::CloudFront::Distribution", "AWS::Route53::RecordSet", "AWS::EC2::VPC"]) {
      template.resourceCountIs(type, 0);
    }
    template.hasResource("AWS::S3::Bucket", {
      DeletionPolicy: "Retain", UpdateReplacePolicy: "Retain",
      Properties: Match.objectLike({
        BucketName: releaseAssetsBucketName(config),
        VersioningConfiguration: { Status: "Enabled" },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true, BlockPublicPolicy: true,
          IgnorePublicAcls: true, RestrictPublicBuckets: true,
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{ ServerSideEncryptionByDefault: { SSEAlgorithm: "AES256" } }],
        },
      }),
    });
    assert.match(JSON.stringify(template.findResources("AWS::S3::BucketPolicy")), /aws:SecureTransport/);
    const [plannerId, planner] = Object.entries(template.findResources("AWS::IAM::Role", {
      Properties: Match.objectLike({ RoleName: `${config.prefix}-release-plan` }),
    }))[0]!;
    const [executionId] = Object.keys(template.findResources("AWS::IAM::Role", {
      Properties: Match.objectLike({ RoleName: `${config.prefix}-execute` }),
    }));
    assert.ok(plannerId && executionId);
    assert.deepEqual(planner.Properties.AssumeRolePolicyDocument, {
      Version: "2012-10-17",
      Statement: [{
        Effect: "Allow", Action: "sts:AssumeRoleWithWebIdentity",
        Principal: { Federated: { "Fn::Join": ["", ["arn:", { Ref: "AWS::Partition" },
          ":iam::123456789012:oidc-provider/token.actions.githubusercontent.com"]] } },
        Condition: { StringEquals: {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": `repo:CteNerd/roddy.tomlin.life:environment:${environment}`,
        } },
      }],
    });
    assert.equal(planner.Properties.ManagedPolicyArns, undefined);
    const policies = Object.values(template.findResources("AWS::IAM::Policy"));
    const plannerPolicy = policies.find((policy) => policy.Properties.Roles.some((role: { Ref: string }) => role.Ref === plannerId));
    assert.ok(plannerPolicy);
    const statements = plannerPolicy.Properties.PolicyDocument.Statement;
    const creation = statements.find((statement: { Action: string }) => statement.Action === "cloudformation:CreateChangeSet");
    assert.ok(creation);
    const stacks = [
      `${config.prefix}-foundation`, `rct-portfolio-${environment}-eventing`,
    ].map((name) => ({
      "Fn::Join": ["", ["arn:", { Ref: "AWS::Partition" }, `:cloudformation:us-east-1:${config.account}:stack/${name}/*`]],
    }));
    assert.deepEqual(creation.Resource, stacks);
    assert.deepEqual(creation.Condition, { StringEquals: {
      "cloudformation:RoleArn": { "Fn::GetAtt": [executionId, "Arn"] },
    } });
    const passing = statements.find((statement: { Action: string }) => statement.Action === "iam:PassRole");
    assert.ok(passing);
    assert.deepEqual(passing.Resource, { "Fn::GetAtt": [executionId, "Arn"] });
    assert.deepEqual(passing.Condition, { StringEquals: { "iam:PassedToService": "cloudformation.amazonaws.com" } });
    const allowed = statements.filter((statement: { Effect: string }) => statement.Effect === "Allow");
    for (const statement of allowed) assert.notEqual(statement.Resource, "*");
    assert.doesNotMatch(JSON.stringify(allowed), /cdk-hnb659fds|AdministratorAccess|dynamodb:|events:|lambda:|iam:Create|iam:Attach|s3:Delete/);
    const denial = statements.find((statement: { Effect: string }) => statement.Effect === "Deny");
    assert.ok(denial);
    assert.equal(denial.Resource, "*");
    for (const action of [
      "sts:AssumeRole", "cloudformation:ExecuteChangeSet", "cloudformation:CreateStack",
      "cloudformation:UpdateStack", "cloudformation:DeleteStack", "cloudformation:ContinueUpdateRollback",
      "cloudformation:RollbackStack", "cloudformation:CancelUpdateStack", "cloudformation:SetStackPolicy",
    ]) assert.ok(denial.Action.includes(action), `Missing execution guard: ${action}`);
    const [boundaryId, executionBoundary] = Object.entries(template.findResources("AWS::IAM::ManagedPolicy", {
      Properties: Match.objectLike({ ManagedPolicyName: `${config.prefix}-execution-boundary` }),
    }))[0]!;
    assert.ok(boundaryId);
    const executionStatements = executionBoundary.Properties.PolicyDocument.Statement;
    assert.equal(executionStatements.length, 4);
    assert.deepEqual(executionStatements[0].Action, ["s3:GetObject", "s3:GetObjectVersion"]);
    const [bucketId] = Object.keys(template.findResources("AWS::S3::Bucket"));
    assert.ok(bucketId);
    const objects = { "Fn::Join": ["", [{ "Fn::GetAtt": [bucketId, "Arn"] }, "/release/*"]] };
    assert.deepEqual(executionStatements[0].Resource, objects);
    for (const statement of executionStatements) assert.notEqual(statement.Resource, "*");
    const reading = executionStatements.find((statement: { Action: string }) => statement.Action === "iam:GetRole");
    assert.ok(reading);
    assert.deepEqual(reading.Resource, ["api", "reporting"].map((handler) => ({
      "Fn::Join": ["", ["arn:", { Ref: "AWS::Partition" },
        `:iam::123456789012:role/rct/founder/${environment}/runtime/${config.prefix}-${handler}`]],
    })));
    assert.doesNotMatch(JSON.stringify(executionStatements), /iam:(Create|Update|Put|Attach|Detach|Delete)|sts:|cloudformation:|lambda:Create|AdministratorAccess/);
    for (const handler of ["api", "reporting"] as const) {
      const roleArn = { "Fn::Join": ["", ["arn:", { Ref: "AWS::Partition" },
        `:iam::123456789012:role/rct/founder/${environment}/runtime/${config.prefix}-${handler}`]] };
      const passing = executionStatements.find((statement: { Action: string; Resource: unknown }) =>
        statement.Action === "iam:PassRole" && JSON.stringify(statement.Resource) === JSON.stringify(roleArn));
      assert.ok(passing);
      assert.deepEqual(passing.Condition, {
        StringEquals: { "iam:PassedToService": "lambda.amazonaws.com" },
        ArnEquals: { "iam:AssociatedResourceArn": { "Fn::Join": ["", ["arn:", { Ref: "AWS::Partition" },
          `:lambda:us-east-1:123456789012:function:${config.prefix}-${handler}`]] } },
      });
    }
    const uploads = statements.find((statement: { Action: string | string[] }) => Array.isArray(statement.Action) && statement.Action.includes("s3:PutObject"));
    assert.ok(uploads);
    assert.deepEqual(uploads.Resource, objects);
    template.hasResourceProperties("AWS::IAM::Role", {
      RoleName: `${config.prefix}-execute`,
      AssumeRolePolicyDocument: {
        Version: "2012-10-17",
        Statement: [{ Action: "sts:AssumeRole", Effect: "Allow", Principal: { Service: "cloudformation.amazonaws.com" } }],
      },
      PermissionsBoundary: { Ref: boundaryId }, ManagedPolicyArns: [{ Ref: boundaryId }],
    });
  });

  test(`${environment} actual Founder release assemblies never assume shared bootstrap roles or publish to shared assets`, () => {
    const config = configuration(environment, "123456789012");
    const app = new App();
    new FounderStack(app, config);
    new EventingStack(app, config);
    const assembly = app.synth();
    assert.equal(assembly.stacks.length, 2);
    for (const stack of assembly.stacks) {
      const properties = stack.manifest.properties;
      assert.ok(properties);
      assert.ok("templateFile" in properties);
      assert.equal(properties.assumeRoleArn, undefined);
      assert.equal(properties.cloudFormationExecutionRoleArn, undefined);
      assert.equal(properties.lookupRole, undefined);
      assert.equal(properties.requiresBootstrapStackVersion, undefined);
      assert.doesNotMatch(JSON.stringify(properties), /cdk-hnb659fds|cdk-bootstrap/);
      assert.doesNotMatch(JSON.stringify(stack.template), /BootstrapVersion|cdk-bootstrap/);
      const manifests = stack.dependencies.filter((dependency) => dependency.manifest.type === "cdk:asset-manifest");
      assert.equal(manifests.length, 1);
      const manifestProperties = manifests[0]!.manifest.properties;
      assert.ok(manifestProperties && "file" in manifestProperties);
      assert.equal(typeof manifestProperties.file, "string");
      const manifest: AssetManifest = JSON.parse(readFileSync(join(assembly.directory, String(manifestProperties.file)), "utf8"));
      assert.equal(Object.keys(manifest.dockerImages ?? {}).length, 0);
      const files = Object.values(manifest.files ?? {});
      assert.ok(files.length >= 2, "Both the bundled Lambda and template must be release assets");
      for (const file of files) {
        for (const destination of Object.values(file.destinations)) {
          assert.equal(destination.bucketName, releaseAssetsBucketName(config));
          assert.match(destination.objectKey, /^release\//);
          assert.equal(destination.region, config.region);
          assert.equal(destination.assumeRoleArn, undefined);
        }
      }
      for (const functionResource of Object.values(Template.fromJSON(stack.template).findResources("AWS::Lambda::Function"))) {
        assert.equal(functionResource.Properties.Code.S3Bucket, releaseAssetsBucketName(config));
        assert.match(functionResource.Properties.Code.S3Key, /^release\//);
      }
    }
  });
}
