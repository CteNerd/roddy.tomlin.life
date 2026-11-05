import { CfnOutput, CliCredentialsStackSynthesizer, RemovalPolicy, Stack, Tags } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";
import type { Configuration } from "./config.ts";
import { applications, founderRuntimeIdentity } from "./governance.ts";

export function releaseAssetsBucketName(config: Configuration): string {
  return `${config.prefix}-release-assets-${config.account}-${config.region}`;
}

export function releaseSynthesizer(config: Configuration): CliCredentialsStackSynthesizer {
  return new CliCredentialsStackSynthesizer({
    fileAssetsBucketName: releaseAssetsBucketName(config),
    bucketPrefix: "release/",
  });
}

export class ReleasePlanningStack extends Stack {
  constructor(scope: Construct, config: Configuration) {
    super(scope, `${config.prefix}-release-planning`, {
      env: { account: config.account, region: config.region },
    });
    Tags.of(this).add("Portfolio", "RCT");
    Tags.of(this).add("Application", "Founder");
    Tags.of(this).add("Environment", config.environment);
    const application = applications.find((entry) => entry.name === "founder");
    if (!application) throw new Error("Founder repository must be in the approved portfolio");
    const assets = new s3.Bucket(this, "ReleaseAssets", {
      bucketName: releaseAssetsBucketName(config),
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });
    const executionStatements = [new iam.PolicyStatement({
      actions: ["s3:GetObject", "s3:GetObjectVersion"],
      resources: [assets.arnForObjects("release/*")],
    })];
    const runtimes = (["api", "reporting"] as const).map((handler) =>
      founderRuntimeIdentity(config, this.partition, handler));
    executionStatements.push(new iam.PolicyStatement({
      actions: ["iam:GetRole"], resources: runtimes.map((runtime) => runtime.roleArn),
    }));
    for (const runtime of runtimes) executionStatements.push(new iam.PolicyStatement({
      actions: ["iam:PassRole"], resources: [runtime.roleArn],
      conditions: {
        StringEquals: { "iam:PassedToService": "lambda.amazonaws.com" },
        ArnEquals: { "iam:AssociatedResourceArn": runtime.functionArn },
      },
    }));
    const executionBoundary = new iam.ManagedPolicy(this, "ExecutionBoundary", {
      managedPolicyName: `${config.prefix}-execution-boundary`,
      path: `/rct-release/founder/${config.environment}/`,
      statements: executionStatements,
    });
    const execution = new iam.Role(this, "ExecutionRole", {
      roleName: `${config.prefix}-execute`,
      path: `/rct-release/founder/${config.environment}/`,
      assumedBy: new iam.ServicePrincipal("cloudformation.amazonaws.com"),
      permissionsBoundary: executionBoundary,
      managedPolicies: [executionBoundary],
      description: "Bounded asset reads and exact runtime pass-role; application service deployment remains blocked",
    });
    const provider = iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
      this, "ExistingGitHubProvider",
      `arn:${this.partition}:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`,
    );
    const planner = new iam.Role(this, "ReleasePlanner", {
      roleName: `${config.prefix}-release-plan`,
      path: `/rct-release/founder/${config.environment}/`,
      assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
        StringEquals: {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": `repo:${application.repository}:environment:${config.environment}`,
        },
      }),
      description: "Publish isolated release assets and prepare own-stack change sets; execution is explicitly denied",
    });
    planner.addToPolicy(new iam.PolicyStatement({
      actions: ["s3:GetBucketLocation", "s3:ListBucket"],
      resources: [assets.bucketArn],
    }));
    planner.addToPolicy(new iam.PolicyStatement({
      actions: ["s3:GetObject", "s3:PutObject", "s3:AbortMultipartUpload", "s3:ListMultipartUploadParts"],
      resources: [assets.arnForObjects("release/*")],
    }));
    const stacks = [
      `${config.prefix}-foundation`,
      `rct-portfolio-${config.environment}-eventing`,
    ].map((name) => `arn:${this.partition}:cloudformation:${this.region}:${this.account}:stack/${name}/*`);
    planner.addToPolicy(new iam.PolicyStatement({
      actions: [
        "cloudformation:DescribeStacks", "cloudformation:DescribeStackEvents",
        "cloudformation:DescribeStackResources", "cloudformation:ListStackResources",
        "cloudformation:GetTemplate", "cloudformation:DescribeChangeSet", "cloudformation:DeleteChangeSet",
      ],
      resources: stacks,
    }));
    planner.addToPolicy(new iam.PolicyStatement({
      actions: ["cloudformation:CreateChangeSet"],
      resources: stacks,
      conditions: { StringEquals: { "cloudformation:RoleArn": execution.roleArn } },
    }));
    planner.addToPolicy(new iam.PolicyStatement({
      actions: ["iam:PassRole"],
      resources: [execution.roleArn],
      conditions: { StringEquals: { "iam:PassedToService": "cloudformation.amazonaws.com" } },
    }));
    planner.addToPolicy(new iam.PolicyStatement({
      actions: ["iam:GetRole"],
      resources: [planner.roleArn],
    }));
    planner.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.DENY,
      actions: [
        "sts:AssumeRole", "cloudformation:ExecuteChangeSet", "cloudformation:CreateStack",
        "cloudformation:UpdateStack", "cloudformation:DeleteStack", "cloudformation:ContinueUpdateRollback",
        "cloudformation:RollbackStack", "cloudformation:CancelUpdateStack", "cloudformation:SetStackPolicy",
      ],
      resources: ["*"],
    }));
    new CfnOutput(this, "ReleasePlanRoleArn", { value: planner.roleArn });
    new CfnOutput(this, "ExecutionRoleArn", { value: execution.roleArn });
    new CfnOutput(this, "ExecutionBoundaryArn", { value: executionBoundary.managedPolicyArn });
    new CfnOutput(this, "ReleaseAssetsBucket", { value: assets.bucketName });
  }
}
