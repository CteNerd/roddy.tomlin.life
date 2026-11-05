import assert from "node:assert/strict";
import { test } from "node:test";
import { App } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { configuration } from "./config.ts";
import { FounderStack } from "./stack.ts";

test("Founder infrastructure neither redeclares live profile hosting nor grants business-data access", () => {
  const template = Template.fromStack(new FounderStack(new App(), configuration("development", "123456789012")));
  for (const type of [
    "AWS::CloudFront::Distribution", "AWS::S3::Bucket", "AWS::Route53::RecordSet",
    "AWS::EC2::VPC", "AWS::EC2::NatGateway", "AWS::RDS::DBCluster", "AWS::Events::EventBus",
  ]) template.resourceCountIs(type, 0);
  template.hasResourceProperties("AWS::DynamoDB::Table", {
    TableName: "rct-founder-development-projections", BillingMode: "PAY_PER_REQUEST",
  });
  template.hasResourceProperties("AWS::ApiGatewayV2::Route", {
    RouteKey: "GET /me", AuthorizationType: "JWT", AuthorizerId: Match.anyValue(),
  });
  const [poolId] = Object.keys(template.findResources("AWS::Cognito::UserPool"));
  const [clientId] = Object.keys(template.findResources("AWS::Cognito::UserPoolClient"));
  assert.ok(poolId);
  assert.ok(clientId);
  template.hasResourceProperties("AWS::ApiGatewayV2::Authorizer", {
    AuthorizerType: "JWT",
    JwtConfiguration: {
      Issuer: { "Fn::Join": ["", ["https://", { "Fn::GetAtt": [poolId, "ProviderURL"] }]] },
      Audience: [{ Ref: clientId }],
    },
  });
  template.resourceCountIs("AWS::ApiGatewayV2::Route", 2);
  template.hasResourceProperties("AWS::Cognito::UserPool", {
    AdminCreateUserConfig: { AllowAdminCreateUserOnly: true }, MfaConfiguration: "ON",
  });
  const policies = JSON.stringify(template.findResources("AWS::IAM::Policy"));
  assert.doesNotMatch(policies, /dynamodb:|events:|sts:AssumeRole|"Resource":"\*"/);
  assert.match(policies, /logs:PutLogEvents/);
});

test("production projection data and Cognito pool survive stack removal", () => {
  const template = Template.fromStack(new FounderStack(new App(), configuration("production", "123456789012")));
  template.hasResource("AWS::DynamoDB::Table", {
    DeletionPolicy: "Retain", UpdateReplacePolicy: "Retain",
    Properties: Match.objectLike({
      TableName: "rct-founder-production-projections", DeletionProtectionEnabled: true,
      PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
    }),
  });
  template.hasResource("AWS::Cognito::UserPool", { DeletionPolicy: "Retain" });
});

test("account, environment and production CORS cannot silently fall back to development", () => {
  assert.throws(() => configuration(undefined, "123456789012"), /environment/);
  assert.throws(() => configuration("production", ""), /account/);
  const template = Template.fromStack(new FounderStack(new App(), configuration("production", "123456789012")));
  template.hasResourceProperties("AWS::ApiGatewayV2::Api", {
    CorsConfiguration: Match.objectLike({ AllowOrigins: ["https://roddy.tomlin.life"] }),
  });
});
