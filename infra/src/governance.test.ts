import assert from "node:assert/strict";
import { test } from "node:test";
import { App } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { configuration } from "./config.ts";
import { applications, GovernanceStack } from "./governance.ts";
import { verifyCaller, verifyEnvironment, verifyTrust, type DeploymentTarget } from "./deployment-readiness.ts";

for (const environment of ["development", "production"] as const) {
  test(`${environment} governance imports OIDC and restricts every planner to its own repo/environment/stacks`, () => {
    const template = Template.fromStack(new GovernanceStack(new App(), configuration(environment, "123456789012")));
    template.resourceCountIs("AWS::IAM::OIDCProvider", 0);
    template.resourceCountIs("AWS::IAM::Role", 5);
    template.resourceCountIs("AWS::IAM::ManagedPolicy", 5);
    for (const application of applications) {
      const prefix = `rct-${application.name}-${environment}`;
      template.hasResourceProperties("AWS::IAM::Role", {
        RoleName: `rct-${application.name}-${environment}-plan`,
        AssumeRolePolicyDocument: {
          Version: "2012-10-17",
          Statement: [Match.objectLike({
            Action: "sts:AssumeRoleWithWebIdentity", Effect: "Allow",
            Condition: { StringEquals: {
              "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
              "token.actions.githubusercontent.com:sub": `repo:${application.repository}:environment:${environment}`,
            } },
          })],
        },
      });
      template.hasResourceProperties("AWS::IAM::Policy", {
        PolicyDocument: Match.objectLike({ Statement: Match.arrayWith([Match.objectLike({
          Action: Match.arrayWith(["cloudformation:DescribeStacks", "cloudformation:GetTemplate"]),
          Resource: { "Fn::Join": ["", ["arn:", { Ref: "AWS::Partition" }, `:cloudformation:us-east-1:123456789012:stack/${prefix}-*/*`]] },
        })]) }),
      });

    }
    const planning = JSON.stringify(template.findResources("AWS::IAM::Policy"));
    assert.doesNotMatch(planning, /iam:PassRole|sts:AssumeRole"|cloudformation:Execute|cloudformation:Create|cloudformation:Delete|"Resource":"\*"/);
    const boundaries = JSON.stringify(template.findResources("AWS::IAM::ManagedPolicy"));
    assert.doesNotMatch(boundaries, /"Action":"\*"|iam:|secretsmanager:|dynamodb:Scan/);
    const founderBoundary = template.findResources("AWS::IAM::ManagedPolicy", {
      Properties: Match.objectLike({ ManagedPolicyName: `rct-founder-${environment}-runtime-boundary` }),
    });
    assert.doesNotMatch(JSON.stringify(founderBoundary), /events:PutEvents|table\/rct-(consulting|dotcom)-/);
    assert.doesNotMatch(JSON.stringify(founderBoundary), /reporting-\*/);
    template.hasResourceProperties("AWS::IAM::ManagedPolicy", {
      ManagedPolicyName: `rct-founder-${environment}-runtime-boundary`,
      PolicyDocument: Match.objectLike({ Statement: Match.arrayWith([Match.objectLike({
        Action: Match.arrayWith(["sqs:ReceiveMessage", "sqs:GetQueueUrl"]),
        Resource: ["consulting", "dotcom"].map((source) => ({
          "Fn::Join": ["", ["arn:", { Ref: "AWS::Partition" }, `:sqs:us-east-1:123456789012:rct-portfolio-${environment}-reporting-${source}`]],
        })),
      })]) }),
    });
    template.hasResourceProperties("AWS::IAM::ManagedPolicy", {
      ManagedPolicyName: `rct-consulting-${environment}-runtime-boundary`,
      PolicyDocument: Match.objectLike({ Statement: Match.arrayWith([Match.objectLike({
        Action: "events:PutEvents",
        Resource: { "Fn::Join": ["", ["arn:", { Ref: "AWS::Partition" }, `:events:us-east-1:123456789012:event-bus/rct-portfolio-${environment}`]] },
        Condition: { StringEquals: {
          "events:source": "rct.consulting",
          "events:detail-type": ["consulting.lead.created.v1", "consulting.lead.count.adjusted.v1"],
        } },
      })]) }),
    });
  });

  test(`${environment} governance fixes Lambda-only runtime identities and separates read API from reporting writes`, () => {
    const template = Template.fromStack(new GovernanceStack(new App(), configuration(environment, "123456789012")));
    for (const handler of ["api", "reporting"] as const) {
      const name = `rct-founder-${environment}-${handler}`;
      const [boundaryId, boundary] = Object.entries(template.findResources("AWS::IAM::ManagedPolicy", {
        Properties: Match.objectLike({ ManagedPolicyName: `${name}-runtime-boundary` }),
      }))[0]!;
      assert.ok(boundaryId);
      template.hasResourceProperties("AWS::IAM::Role", {
        RoleName: name, Path: `/rct/founder/${environment}/runtime/`,
        PermissionsBoundary: { Ref: boundaryId }, ManagedPolicyArns: [{ Ref: boundaryId }],
        AssumeRolePolicyDocument: {
          Version: "2012-10-17",
          Statement: [{ Effect: "Allow", Action: "sts:AssumeRole", Principal: { Service: "lambda.amazonaws.com" } }],
        },
      });
      const statements = boundary.Properties.PolicyDocument.Statement;
      const allowed = new Set(handler === "api" ? [
        "logs:CreateLogStream", "logs:PutLogEvents", "dynamodb:Query",
      ] : [
        "logs:CreateLogStream", "logs:PutLogEvents", "dynamodb:GetItem", "dynamodb:PutItem",
        "sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes", "sqs:GetQueueUrl", "sqs:ChangeMessageVisibility",
      ]);
      const actual = new Set<string>();
      for (const statement of statements) {
        assert.equal(statement.Effect, "Allow");
        const actions: string[] = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
        for (const action of actions) {
          assert.ok(allowed.has(action), `Unexpected ${handler} boundary grant: ${action}`);
          actual.add(action);
        }
        assert.notEqual(statement.Resource, "*");
        if (actions.some((action) => action.startsWith("dynamodb:"))) {
          assert.deepEqual(statement.Resource, { "Fn::Join": ["", ["arn:", { Ref: "AWS::Partition" },
            `:dynamodb:us-east-1:123456789012:table/rct-founder-${environment}-projections`]] });
          if (handler === "api") assert.deepEqual(statement.Condition, {
            "ForAllValues:StringLike": { "dynamodb:LeadingKeys": ["MONTH#????-??"] },
            Null: { "dynamodb:LeadingKeys": "false" },
          });
        }
        if (actions.some((action) => action.startsWith("logs:"))) assert.deepEqual(statement.Resource, {
          "Fn::Join": ["", ["arn:", { Ref: "AWS::Partition" },
            `:logs:us-east-1:123456789012:log-group:/rct/rct-founder-${environment}/${handler}:log-stream:*`]],
        });
        if (actions.some((action) => action.startsWith("sqs:"))) assert.deepEqual(statement.Resource,
          ["consulting", "dotcom"].map((source) => ({
            "Fn::Join": ["", ["arn:", { Ref: "AWS::Partition" },
              `:sqs:us-east-1:123456789012:rct-portfolio-${environment}-reporting-${source}`]],
          })));
      }
      assert.deepEqual(actual, allowed);
    }
  });
}

const target: DeploymentTarget = {
  repository: "CteNerd/roddy.tomlin.life", environment: "production",
  account: "123456789012", roleArn: "arn:aws:iam::123456789012:role/rct/founder-production-deploy",
};
const environment = {
  name: "production",
  can_admins_bypass: false,
  deployment_branch_policy: { custom_branch_policies: true, protected_branches: false },
  protection_rules: [{ type: "required_reviewers", reviewers: [{ type: "User", reviewer: { id: 1 } }] }],
};
const branches = { total_count: 1, branch_policies: [{ name: "main", type: "branch" }] };
const trust = () => ({
  Version: "2012-10-17",
  Statement: [{
    Effect: "Allow", Action: "sts:AssumeRoleWithWebIdentity",
    Principal: { Federated: "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com" },
    Condition: { StringEquals: {
      "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
      "token.actions.githubusercontent.com:sub": "repo:CteNerd/roddy.tomlin.life:environment:production",
    } },
  }],
});

test("production preflight requires real reviewer approval and exactly main, never manual dispatch alone", () => {
  verifyEnvironment(target, environment, branches);
  assert.throws(() => verifyEnvironment(target, { ...environment, protection_rules: [] }, branches), /reviewer approval/);
  assert.throws(() => verifyEnvironment(target, { ...environment, can_admins_bypass: true }, branches), /reviewer approval/);
  assert.throws(() => verifyEnvironment(target, environment, { total_count: 1, branch_policies: [{ name: "*", type: "branch" }] }), /main branch/);
  assert.throws(() => verifyEnvironment(target, environment, { total_count: 1, branch_policies: [{ name: "main", type: "tag" }] }), /main branch/);
  assert.throws(() => verifyEnvironment(target, environment, { total_count: 2, branch_policies: branches.branch_policies }), /main branch/);
  assert.throws(() => verifyEnvironment(target, environment, { total_count: 2, branch_policies: [...branches.branch_policies, { name: "release/*", type: "branch" }] }), /main branch/);
});

test("trust preflight rejects wildcard, cross-repository, cross-environment and extra-principal grants", () => {
  verifyTrust(target, trust());
  for (const subject of ["repo:CteNerd/*:environment:production", "repo:CteNerd/community.wellcall.biz:environment:production", "repo:CteNerd/roddy.tomlin.life:environment:development"]) {
    const document = trust();
    document.Statement[0]!.Condition.StringEquals["token.actions.githubusercontent.com:sub"] = subject;
    assert.throws(() => verifyTrust(target, document), /exact repository/);
  }
  const extra = trust();
  extra.Statement.push(...trust().Statement);
  assert.throws(() => verifyTrust(target, extra), /exactly one/);
  const audience = trust();
  audience.Statement[0]!.Condition.StringEquals["token.actions.githubusercontent.com:aud"] = "unapproved";
  assert.throws(() => verifyTrust(target, audience), /audience/);
});

test("caller preflight rejects local users and wrong-role/account sessions", () => {
  verifyCaller(target, { Account: "123456789012", Arn: "arn:aws:sts::123456789012:assumed-role/founder-production-deploy/session" });
  for (const identity of [
    { Account: "123456789012", Arn: "arn:aws:iam::123456789012:user/admin" },
    { Account: "123456789012", Arn: "arn:aws:sts::123456789012:assumed-role/unrelated-admin/session" },
    { Account: "999999999999", Arn: "arn:aws:sts::999999999999:assumed-role/founder-production-deploy/session" },
  ]) assert.throws(() => verifyCaller(target, identity), /short-lived target role/);
});
