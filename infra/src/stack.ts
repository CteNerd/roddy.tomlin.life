import { CfnOutput, CfnParameter, Duration, RemovalPolicy, Stack, Tags } from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigatewayv2";
import { HttpJwtAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import type { Construct } from "constructs";
import { resolve } from "node:path";
import type { Configuration } from "./config.ts";
import { releaseSynthesizer } from "./release-planning.ts";
import { founderRuntimeIdentity } from "./governance.ts";

export class FounderStack extends Stack {
  constructor(scope: Construct, config: Configuration) {
    super(scope, `${config.prefix}-foundation`, {
      env: { account: config.account, region: config.region },
      synthesizer: releaseSynthesizer(config),
    });
    Tags.of(this).add("Portfolio", "RCT");
    Tags.of(this).add("Application", "Founder");
    Tags.of(this).add("Environment", config.environment);
    const production = config.environment === "production";
    const removalPolicy = production ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;
    const projections = new dynamodb.Table(this, "Projections", {
      tableName: `${config.prefix}-projections`,
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      deletionProtection: production,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: production },
      removalPolicy,
    });
    const pool = new cognito.UserPool(this, "Auth", {
      userPoolName: `${config.prefix}-users`, selfSignUpEnabled: false,
      signInAliases: { email: true }, mfa: cognito.Mfa.REQUIRED,
      mfaSecondFactor: { sms: false, otp: true },
      passwordPolicy: { minLength: 14, requireDigits: true, requireSymbols: true, requireLowercase: true, requireUppercase: true },
      removalPolicy,
    });
    const client = pool.addClient("Browser", {
      generateSecret: false, preventUserExistenceErrors: true, authFlows: { userSrp: true },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        callbackUrls: [`${config.webOrigin}/auth/callback`],
        logoutUrls: [config.webOrigin],
      },
    });
    const logGroup = new logs.LogGroup(this, "ApiLogs", {
      logGroupName: `/rct/${config.prefix}/api`,
      retention: production ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.ONE_WEEK,
      removalPolicy,
    });
    const identity = founderRuntimeIdentity(config, this.partition, "api");
    const role = iam.Role.fromRoleArn(this, "ApiRole", identity.roleArn, { mutable: false });
    const ownerSubject = new CfnParameter(this, "FounderOwnerSubject", {
      type: "String", default: "disabled",
      allowedPattern: "^(disabled|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$",
      description: "Keep disabled until the reviewed owner is invited into this MFA-required Cognito pool; use its exact sub, never an email",
    });
    const handler = new NodejsFunction(this, "ApiHandler", {
      functionName: identity.name,
      entry: resolve(import.meta.dirname, "../../apps/api/src/index.ts"),
      depsLockFilePath: resolve(import.meta.dirname, "../../package-lock.json"),
      runtime: lambda.Runtime.NODEJS_24_X, handler: "handler",
      memorySize: 256, timeout: Duration.seconds(10), logGroup, role,
      environment: { REPORTING_TABLE_NAME: projections.tableName, FOUNDER_OWNER_SUBJECT: ownerSubject.valueAsString },
      bundling: { minify: true, sourceMap: false, externalModules: [] },
    });
    const api = new apigateway.HttpApi(this, "Api", {
      apiName: `${config.prefix}-api`,
      corsPreflight: {
        allowOrigins: [config.webOrigin], allowMethods: [apigateway.CorsHttpMethod.GET],
        allowHeaders: ["authorization", "content-type"],
      },
    });
    const integration = new HttpLambdaIntegration("ApiIntegration", handler);
    api.addRoutes({ path: "/health", methods: [apigateway.HttpMethod.GET], integration });
    const authorizer = new HttpJwtAuthorizer("Cognito", `https://${pool.userPoolProviderUrl}`, { jwtAudience: [client.userPoolClientId] });
    for (const path of ["/me", "/metrics"]) api.addRoutes({
      path, methods: [apigateway.HttpMethod.GET], integration, authorizer,
    });
    new CfnOutput(this, "ApiUrl", { value: api.apiEndpoint });
    new CfnOutput(this, "UserPoolId", { value: pool.userPoolId });
    new CfnOutput(this, "UserPoolClientId", { value: client.userPoolClientId });
  }
}
