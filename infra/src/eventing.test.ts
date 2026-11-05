import assert from "node:assert/strict";
import { test } from "node:test";
import { App } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { configuration } from "./config.ts";
import { EventingStack } from "./eventing.ts";

for (const environment of ["development", "production"] as const) {
  test(`${environment} eventing isolates approved sources, retry/DLQ paths and bounded worker authority`, () => {
    const template = Template.fromStack(new EventingStack(new App(), configuration(environment, "123456789012")));
    template.resourceCountIs("AWS::Events::EventBus", 1);
    template.resourceCountIs("AWS::Events::Rule", 2);
    template.resourceCountIs("AWS::SQS::Queue", 6);
    template.resourceCountIs("AWS::Lambda::EventSourceMapping", 2);
    template.resourceCountIs("AWS::IAM::Role", 0);
    template.resourceCountIs("AWS::IAM::Policy", 0);
    template.resourceCountIs("AWS::IAM::ManagedPolicy", 0);
    template.resourceCountIs("AWS::CloudWatch::Alarm", 7);
    for (const type of ["AWS::DynamoDB::Table", "AWS::CloudFront::Distribution", "AWS::S3::Bucket", "AWS::Route53::RecordSet", "AWS::EC2::VPC", "AWS::EC2::NatGateway", "AWS::RDS::DBCluster"]) {
      template.resourceCountIs(type, 0);
    }
    template.hasResourceProperties("AWS::Events::EventBus", { Name: `rct-portfolio-${environment}` });
    for (const [source, detailTypes] of [
      ["consulting", ["consulting.lead.created.v1", "consulting.lead.count.adjusted.v1"]],
      ["dotcom", ["dotcom.mentor.approved.v1", "dotcom.mentor.approval.count.adjusted.v1"]],
    ] as const) {
      const name = `rct-portfolio-${environment}-reporting-${source}`;
      const [queueId] = Object.keys(template.findResources("AWS::SQS::Queue", { Properties: Match.objectLike({ QueueName: name }) }));
      const [processingId] = Object.keys(template.findResources("AWS::SQS::Queue", { Properties: Match.objectLike({ QueueName: `${name}-processing-dlq` }) }));
      const [deliveryId] = Object.keys(template.findResources("AWS::SQS::Queue", { Properties: Match.objectLike({ QueueName: `${name}-delivery-dlq` }) }));
      assert.ok(queueId && processingId && deliveryId);
      template.hasResourceProperties("AWS::SQS::Queue", {
        QueueName: name, MessageRetentionPeriod: 345600, VisibilityTimeout: 181, SqsManagedSseEnabled: true,
        RedrivePolicy: { deadLetterTargetArn: { "Fn::GetAtt": [processingId, "Arn"] }, maxReceiveCount: 5 },
      });
      for (const suffix of ["delivery-dlq", "processing-dlq"]) template.hasResourceProperties("AWS::SQS::Queue", {
        QueueName: `${name}-${suffix}`, MessageRetentionPeriod: 1209600, SqsManagedSseEnabled: true,
      });
      template.hasResourceProperties("AWS::Events::Rule", {
        EventPattern: { source: [`rct.${source}`], "detail-type": [...detailTypes] },
        Targets: [Match.objectLike({
          Arn: { "Fn::GetAtt": [queueId, "Arn"] },
          DeadLetterConfig: { Arn: { "Fn::GetAtt": [deliveryId, "Arn"] } },
          RetryPolicy: { MaximumEventAgeInSeconds: 86400, MaximumRetryAttempts: 185 },
        })],
      });
      template.hasResourceProperties("AWS::Lambda::EventSourceMapping", {
        EventSourceArn: { "Fn::GetAtt": [queueId, "Arn"] },
        BatchSize: 10, MaximumBatchingWindowInSeconds: 1,
        FunctionResponseTypes: ["ReportBatchItemFailures"], ScalingConfig: { MaximumConcurrency: 2 },
      });
      if (environment === "production") template.hasResource("AWS::SQS::Queue", {
        Properties: Match.objectLike({ QueueName: name }), DeletionPolicy: "Retain", UpdateReplacePolicy: "Retain",
      });
    }
    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: `rct-founder-${environment}-reporting`,
      Role: { "Fn::Join": ["", ["arn:", { Ref: "AWS::Partition" },
        `:iam::123456789012:role/rct/founder/${environment}/runtime/rct-founder-${environment}-reporting`]] },
      Runtime: "nodejs24.x", Timeout: 30, ReservedConcurrentExecutions: 4,
      Environment: { Variables: Match.objectLike({ REPORTING_TABLE_NAME: `rct-founder-${environment}-projections` }) },
    });
    template.hasResourceProperties("AWS::SSM::Parameter", { Name: `/rct/${environment}/portfolio/event-bus-arn` });
    const queuePolicies = JSON.stringify(template.findResources("AWS::SQS::QueuePolicy"));
    assert.match(queuePolicies, /aws:SecureTransport/);
    assert.match(queuePolicies, /aws:SourceArn/);
    assert.match(queuePolicies, /events\.amazonaws\.com/);
    assert.doesNotMatch(queuePolicies, /role\/rct\/founder\/.*\/runtime/);
    assert.doesNotMatch(JSON.stringify(template.findResources("AWS::CloudWatch::Alarm")), /AlarmActions|OKActions/);
  });
}
