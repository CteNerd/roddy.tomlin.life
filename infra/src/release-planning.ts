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
    const createExecutionRole = (
      handler: "api" | "reporting",
      statements: iam.PolicyStatement[],
    ) => {
      const identity = founderRuntimeIdentity(config, this.partition, handler);
      statements.push(new iam.PolicyStatement({
        actions: ["s3:GetObject", "s3:GetObjectVersion"],
        resources: [assets.arnForObjects("release/*")],
      }));
      statements.push(new iam.PolicyStatement({
        actions: ["iam:GetRole"], resources: [identity.roleArn],
      }));
      statements.push(new iam.PolicyStatement({
        actions: ["iam:PassRole"], resources: [identity.roleArn],
        conditions: {
          StringEquals: { "iam:PassedToService": "lambda.amazonaws.com" },
          ArnEquals: { "iam:AssociatedResourceArn": identity.functionArn },
        },
      }));
      const boundary = new iam.ManagedPolicy(this, `${handler}ExecutionBoundary`, {
        managedPolicyName: `${config.prefix}-${handler}-execution-boundary`,
        path: `/rct-release/founder/${config.environment}/`,
        statements,
      });
      const role = new iam.Role(this, `${handler}ExecutionRole`, {
        roleName: `${config.prefix}-execute-${handler}`,
        path: `/rct-release/founder/${config.environment}/`,
        assumedBy: new iam.ServicePrincipal("cloudformation.amazonaws.com"),
        permissionsBoundary: boundary,
        managedPolicies: [boundary],
        description: `Founder ${handler} CloudFormation execution, bounded to its stack resources`,
      });
      return { role, boundary };
    };
    const api = `${config.prefix}-api`;
    const apiArn = `arn:${this.partition}:lambda:${this.region}:${this.account}:function:${api}`;
    const apiGateway = `arn:${this.partition}:apigateway:${this.region}::/apis`;
    const apiGatewayTags = `arn:${this.partition}:apigateway:${this.region}::/tags/arn%3A${this.partition}%3Aapigateway%3A${this.region}%3A%3A%2Fv2%2Fapis%2F`;
    const apiLogGroup = `arn:${this.partition}:logs:${this.region}:${this.account}:log-group:/rct/${config.prefix}/api`;
    const logGroupDiscovery = () => new iam.PolicyStatement({
      actions: ["logs:DescribeLogGroups"],
      resources: ["*"],
      conditions: { StringEquals: { "aws:RequestedRegion": config.region } },
    });
    const apiExecution = createExecutionRole("api", [
      new iam.PolicyStatement({
        actions: [
          "dynamodb:CreateTable", "dynamodb:DescribeTable", "dynamodb:UpdateTable", "dynamodb:DeleteTable",
          "dynamodb:DescribeContinuousBackups", "dynamodb:UpdateContinuousBackups",
          "dynamodb:TagResource", "dynamodb:UntagResource", "dynamodb:ListTagsOfResource",
        ],
        resources: [`arn:${this.partition}:dynamodb:${this.region}:${this.account}:table/${config.prefix}-projections`],
      }),
      new iam.PolicyStatement({
        actions: ["cognito-idp:CreateUserPool"],
        resources: [`arn:${this.partition}:cognito-idp:${this.region}:${this.account}:userpool/*`],
        conditions: { StringEquals: {
          "aws:RequestTag/Portfolio": "RCT",
          "aws:RequestTag/Application": "Founder",
          "aws:RequestTag/Environment": config.environment,
        } },
      }),
      new iam.PolicyStatement({
        actions: [
          "cognito-idp:DescribeUserPool", "cognito-idp:UpdateUserPool", "cognito-idp:DeleteUserPool",
          "cognito-idp:GetUserPoolMfaConfig", "cognito-idp:SetUserPoolMfaConfig",
          "cognito-idp:CreateUserPoolClient", "cognito-idp:DescribeUserPoolClient",
          "cognito-idp:UpdateUserPoolClient", "cognito-idp:DeleteUserPoolClient",
          "cognito-idp:CreateUserPoolDomain", "cognito-idp:UpdateUserPoolDomain",
          "cognito-idp:DeleteUserPoolDomain",
          "cognito-idp:TagResource", "cognito-idp:UntagResource", "cognito-idp:ListTagsForResource",
        ],
        resources: [`arn:${this.partition}:cognito-idp:${this.region}:${this.account}:userpool/*`],
        conditions: { StringEquals: {
          "aws:ResourceTag/Portfolio": "RCT",
          "aws:ResourceTag/Application": "Founder",
          "aws:ResourceTag/Environment": config.environment,
        } },
      }),
      new iam.PolicyStatement({
        actions: ["cognito-idp:DescribeUserPoolDomain"],
        resources: ["*"],
        conditions: { StringEquals: { "aws:RequestedRegion": config.region } },
      }),
      logGroupDiscovery(),
      new iam.PolicyStatement({
        actions: [
          "logs:CreateLogGroup", "logs:DeleteLogGroup", "logs:PutRetentionPolicy",
          "logs:DeleteRetentionPolicy", "logs:TagResource", "logs:UntagResource",
          "logs:ListTagsForResource",
        ],
        resources: [apiLogGroup, `${apiLogGroup}:*`],
      }),
      new iam.PolicyStatement({
        actions: [
          "lambda:CreateFunction", "lambda:DeleteFunction", "lambda:GetFunction",
          "lambda:GetFunctionConfiguration", "lambda:UpdateFunctionCode",
          "lambda:UpdateFunctionConfiguration", "lambda:TagResource", "lambda:UntagResource",
          "lambda:ListTags", "lambda:GetPolicy",
        ],
        resources: [apiArn],
      }),
      new iam.PolicyStatement({
        actions: ["lambda:AddPermission", "lambda:RemovePermission"],
        resources: [apiArn],
        conditions: { StringEquals: { "lambda:Principal": "apigateway.amazonaws.com" } },
      }),
      new iam.PolicyStatement({
        actions: ["apigateway:GET", "apigateway:POST", "apigateway:PUT", "apigateway:PATCH", "apigateway:DELETE"],
        resources: [apiGateway, `${apiGateway}/??????????`, `${apiGateway}/??????????/*`],
      }),
      new iam.PolicyStatement({
        actions: ["apigateway:GET", "apigateway:PUT", "apigateway:DELETE"],
        resources: [`${apiGatewayTags}??????????`],
      }),
      new iam.PolicyStatement({
        actions: ["apigateway:POST"],
        resources: [`${apiGatewayTags}*`],
        conditions: { StringEquals: {
          "aws:RequestTag/Portfolio": "RCT",
          "aws:RequestTag/Application": "Founder",
          "aws:RequestTag/Environment": config.environment,
        } },
      }),
    ]);
    const reportingFunctionArn = `arn:${this.partition}:lambda:${this.region}:${this.account}:function:${config.prefix}-reporting`;
    const reportingLogGroup = `arn:${this.partition}:logs:${this.region}:${this.account}:log-group:/rct/${config.prefix}/reporting`;
    const busName = `rct-portfolio-${config.environment}`;
    const queues = ["consulting", "dotcom"].flatMap((source) => {
      const name = `${busName}-reporting-${source}`;
      return [name, `${name}-delivery-dlq`, `${name}-processing-dlq`]
        .map((queueName) => `arn:${this.partition}:sqs:${this.region}:${this.account}:${queueName}`);
    });
    const eventBus = `arn:${this.partition}:events:${this.region}:${this.account}:event-bus/${busName}`;
    const rules = ["consulting", "dotcom"].map((source) =>
      `arn:${this.partition}:events:${this.region}:${this.account}:rule/${busName}/${busName}-${source}-approved-events`);
    const alarms = [
      ...["consulting", "dotcom"].flatMap((source) =>
        ["delivery-failures", "processing-failures", "backlog-age"]
          .map((alarm) => `arn:${this.partition}:cloudwatch:${this.region}:${this.account}:alarm:${busName}-${source}-${alarm}`)),
      `arn:${this.partition}:cloudwatch:${this.region}:${this.account}:alarm:${busName}-worker-errors`,
    ];
    const reportingExecution = createExecutionRole("reporting", [
      logGroupDiscovery(),
      new iam.PolicyStatement({
        actions: [
          "logs:CreateLogGroup", "logs:DeleteLogGroup", "logs:PutRetentionPolicy",
          "logs:DeleteRetentionPolicy", "logs:TagResource", "logs:UntagResource",
          "logs:ListTagsForResource",
        ],
        resources: [reportingLogGroup, `${reportingLogGroup}:*`],
      }),
      new iam.PolicyStatement({
        actions: [
          "lambda:CreateFunction", "lambda:DeleteFunction", "lambda:GetFunction",
          "lambda:GetFunctionConfiguration", "lambda:UpdateFunctionCode",
          "lambda:UpdateFunctionConfiguration", "lambda:TagResource", "lambda:UntagResource",
          "lambda:ListTags", "lambda:PutFunctionConcurrency", "lambda:DeleteFunctionConcurrency",
        ],
        resources: [reportingFunctionArn],
      }),
      new iam.PolicyStatement({
        actions: [
          "lambda:CreateEventSourceMapping", "lambda:DeleteEventSourceMapping",
          "lambda:GetEventSourceMapping", "lambda:UpdateEventSourceMapping",
        ],
        resources: [`arn:${this.partition}:lambda:${this.region}:${this.account}:event-source-mapping:*`],
        conditions: { ArnEquals: { "lambda:FunctionArn": reportingFunctionArn } },
      }),
      new iam.PolicyStatement({
        actions: [
          "events:CreateEventBus", "events:DeleteEventBus", "events:DescribeEventBus",
          "events:TagResource", "events:UntagResource", "events:ListTagsForResource",
        ],
        resources: [eventBus],
      }),
      new iam.PolicyStatement({
        actions: [
          "events:PutRule", "events:DeleteRule", "events:DescribeRule", "events:EnableRule",
          "events:DisableRule", "events:PutTargets", "events:RemoveTargets", "events:ListTargetsByRule",
          "events:TagResource", "events:UntagResource", "events:ListTagsForResource",
        ],
        resources: rules,
      }),
      new iam.PolicyStatement({
        actions: [
          "sqs:CreateQueue", "sqs:DeleteQueue", "sqs:GetQueueAttributes", "sqs:GetQueueUrl",
          "sqs:SetQueueAttributes", "sqs:TagQueue", "sqs:UntagQueue", "sqs:ListQueueTags",
        ],
        resources: queues,
      }),
      new iam.PolicyStatement({
        actions: [
          "cloudwatch:PutMetricAlarm", "cloudwatch:DeleteAlarms", "cloudwatch:DescribeAlarms",
          "cloudwatch:TagResource", "cloudwatch:UntagResource", "cloudwatch:ListTagsForResource",
        ],
        resources: alarms,
      }),
      new iam.PolicyStatement({
        actions: [
          "ssm:PutParameter", "ssm:DeleteParameter", "ssm:GetParameter",
          "ssm:AddTagsToResource", "ssm:RemoveTagsFromResource", "ssm:ListTagsForResource",
        ],
        resources: [`arn:${this.partition}:ssm:${this.region}:${this.account}:parameter/rct/${config.environment}/portfolio/event-bus-arn`],
      }),
    ]);
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
    const foundationStackName = `${config.prefix}-foundation`;
    const eventingStackName = `rct-portfolio-${config.environment}-eventing`;
    const foundationStackArn = `arn:${this.partition}:cloudformation:${this.region}:${this.account}:stack/${foundationStackName}/*`;
    const eventingStackArn = `arn:${this.partition}:cloudformation:${this.region}:${this.account}:stack/${eventingStackName}/*`;
    planner.addToPolicy(new iam.PolicyStatement({
      actions: [
        "cloudformation:DescribeStacks", "cloudformation:DescribeStackEvents",
        "cloudformation:DescribeStackResources", "cloudformation:ListStackResources",
        "cloudformation:GetTemplate", "cloudformation:DescribeChangeSet", "cloudformation:DeleteChangeSet",
      ],
      resources: [foundationStackArn, eventingStackArn],
    }));
    planner.addToPolicy(new iam.PolicyStatement({
      actions: ["cloudformation:CreateChangeSet"],
      resources: [foundationStackArn],
      conditions: { StringEquals: { "cloudformation:RoleArn": apiExecution.role.roleArn } },
    }));
    planner.addToPolicy(new iam.PolicyStatement({
      actions: ["cloudformation:CreateChangeSet"],
      resources: [eventingStackArn],
      conditions: { StringEquals: { "cloudformation:RoleArn": reportingExecution.role.roleArn } },
    }));
    planner.addToPolicy(new iam.PolicyStatement({
      actions: ["iam:PassRole"],
      resources: [apiExecution.role.roleArn, reportingExecution.role.roleArn],
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
    new CfnOutput(this, "ApiExecutionRoleArn", { value: apiExecution.role.roleArn });
    new CfnOutput(this, "ApiExecutionBoundaryArn", { value: apiExecution.boundary.managedPolicyArn });
    new CfnOutput(this, "ReportingExecutionRoleArn", { value: reportingExecution.role.roleArn });
    new CfnOutput(this, "ReportingExecutionBoundaryArn", { value: reportingExecution.boundary.managedPolicyArn });
    new CfnOutput(this, "ReleaseAssetsBucket", { value: assets.bucketName });
  }
}
