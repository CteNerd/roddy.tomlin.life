import { CfnOutput, Stack, Tags } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import type { Construct } from "constructs";
import type { Configuration } from "./config.ts";

export const applications = [
  { name: "consulting", repository: "CteNerd/consulting.wellcall.biz", source: "rct.consulting", detailTypes: ["consulting.lead.created.v1", "consulting.lead.count.adjusted.v1"] },
  { name: "dotcom", repository: "CteNerd/community.wellcall.biz", source: "rct.dotcom", detailTypes: ["dotcom.mentor.approved.v1", "dotcom.mentor.approval.count.adjusted.v1"] },
  { name: "founder", repository: "CteNerd/roddy.tomlin.life", source: undefined, detailTypes: [] },
] as const;

export function founderRuntimeIdentity(config: Configuration, partition: string, handler: "api" | "reporting") {
  const name = `${config.prefix}-${handler}`;
  const path = `/rct/founder/${config.environment}/runtime/`;
  return {
    name, path,
    roleArn: `arn:${partition}:iam::${config.account}:role${path}${name}`,
    functionArn: `arn:${partition}:lambda:${config.region}:${config.account}:function:${name}`,
  };
}

export class GovernanceStack extends Stack {
  constructor(scope: Construct, config: Configuration) {
    super(scope, `rct-governance-${config.environment}`, {
      env: { account: config.account, region: config.region },
    });
    Tags.of(this).add("Portfolio", "RCT");
    Tags.of(this).add("Environment", config.environment);
    const provider = iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
      this, "ExistingGitHubProvider",
      `arn:${this.partition}:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`,
    );
    for (const application of applications) {
      const prefix = `rct-${application.name}-${config.environment}`;
      const boundary = new iam.ManagedPolicy(this, `${application.name}RuntimeBoundary`, {
        managedPolicyName: `${prefix}-runtime-boundary`,
        path: `/rct/${application.name}/${config.environment}/`,
        statements: [
          new iam.PolicyStatement({
            actions: ["logs:CreateLogStream", "logs:PutLogEvents"],
            resources: [`arn:${this.partition}:logs:${this.region}:${this.account}:log-group:/rct/${prefix}/*:*`],
          }),
          new iam.PolicyStatement({
            actions: [
              "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem",
              "dynamodb:DeleteItem", "dynamodb:ConditionCheckItem", "dynamodb:Query",
              "dynamodb:BatchGetItem", "dynamodb:BatchWriteItem", "dynamodb:DescribeTable",
            ],
            resources: [`arn:${this.partition}:dynamodb:${this.region}:${this.account}:table/${prefix}-*`],
          }),
        ],
      });
      if (application.source) {
        boundary.addStatements(new iam.PolicyStatement({
          actions: ["events:PutEvents"],
          resources: [`arn:${this.partition}:events:${this.region}:${this.account}:event-bus/rct-portfolio-${config.environment}`],
          conditions: {
            StringEquals: {
              "events:source": application.source,
              "events:detail-type": [...application.detailTypes],
            },
          },
        }));
      } else {
        boundary.addStatements(new iam.PolicyStatement({
          actions: ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes", "sqs:GetQueueUrl", "sqs:ChangeMessageVisibility"],
          resources: ["consulting", "dotcom"].map((source) =>
            `arn:${this.partition}:sqs:${this.region}:${this.account}:rct-portfolio-${config.environment}-reporting-${source}`),
        }));
        for (const handler of ["api", "reporting"] as const) {
          const identity = founderRuntimeIdentity(config, this.partition, handler);
          const statements = [
            new iam.PolicyStatement({
              actions: ["logs:CreateLogStream", "logs:PutLogEvents"],
              resources: [`arn:${this.partition}:logs:${this.region}:${this.account}:log-group:/rct/${config.prefix}/${handler}:log-stream:*`],
            }),
            new iam.PolicyStatement({
              actions: handler === "api" ? ["dynamodb:Query"] : ["dynamodb:GetItem", "dynamodb:PutItem"],
              resources: [`arn:${this.partition}:dynamodb:${this.region}:${this.account}:table/${config.prefix}-projections`],
              ...(handler === "api" ? {
                conditions: {
                  "ForAllValues:StringLike": { "dynamodb:LeadingKeys": ["MONTH#????-??"] },
                  Null: { "dynamodb:LeadingKeys": "false" },
                },
              } : {}),
            }),
          ];
          if (handler === "reporting") statements.push(new iam.PolicyStatement({
            actions: ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes", "sqs:GetQueueUrl", "sqs:ChangeMessageVisibility"],
            resources: ["consulting", "dotcom"].map((source) =>
              `arn:${this.partition}:sqs:${this.region}:${this.account}:rct-portfolio-${config.environment}-reporting-${source}`),
          }));
          const runtimeBoundary = new iam.ManagedPolicy(this, `founder${handler}Boundary`, {
            managedPolicyName: `${identity.name}-runtime-boundary`,
            path: `/rct/founder/${config.environment}/`,
            statements,
          });
          const runtime = new iam.Role(this, `founder${handler}Role`, {
            roleName: identity.name, path: identity.path,
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
            permissionsBoundary: runtimeBoundary,
            managedPolicies: [runtimeBoundary],
            description: `Governance-owned Founder ${handler} runtime; application execution cannot alter IAM`,
          });
          new CfnOutput(this, `founder${handler}RoleArn`, { value: runtime.roleArn });
          new CfnOutput(this, `founder${handler}BoundaryArn`, { value: runtimeBoundary.managedPolicyArn });
        }
      }
      const planner = new iam.Role(this, `${application.name}Planner`, {
        roleName: `${prefix}-plan`,
        path: `/rct-governance/${application.name}/${config.environment}/`,
        assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
            "token.actions.githubusercontent.com:sub": `repo:${application.repository}:environment:${config.environment}`,
          },
        }),
        description: "Read-only stack planning; no bootstrap assumption, pass-role or deployment authority",
      });
      planner.addToPolicy(new iam.PolicyStatement({
        actions: [
          "cloudformation:DescribeStacks", "cloudformation:DescribeStackEvents",
          "cloudformation:DescribeStackResources", "cloudformation:ListStackResources",
          "cloudformation:GetTemplate", "cloudformation:DescribeChangeSet",
        ],
        resources: [`arn:${this.partition}:cloudformation:${this.region}:${this.account}:stack/${prefix}-*/*`],
      }));
      planner.addToPolicy(new iam.PolicyStatement({
        actions: ["iam:GetRole"], resources: [planner.roleArn],
      }));
      new CfnOutput(this, `${application.name}PlanRoleArn`, { value: planner.roleArn });
      new CfnOutput(this, `${application.name}RuntimeBoundaryArn`, { value: boundary.managedPolicyArn });
    }
  }
}
