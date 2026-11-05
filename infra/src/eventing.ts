import { CfnOutput, Duration, RemovalPolicy, Stack, Tags } from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";
import { resolve } from "node:path";
import type { Configuration } from "./config.ts";
import { applications, founderRuntimeIdentity } from "./governance.ts";
import { releaseSynthesizer } from "./release-planning.ts";

export class EventingStack extends Stack {
  constructor(scope: Construct, config: Configuration) {
    super(scope, `rct-portfolio-${config.environment}-eventing`, {
      env: { account: config.account, region: config.region },
      synthesizer: releaseSynthesizer(config),
    });
    Tags.of(this).add("Portfolio", "RCT");
    Tags.of(this).add("Environment", config.environment);
    const production = config.environment === "production";
    const removalPolicy = production ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;
    const bus = new events.EventBus(this, "PortfolioBus", { eventBusName: `rct-portfolio-${config.environment}` });
    bus.applyRemovalPolicy(removalPolicy);
    const queues = new Map<"consulting" | "dotcom", sqs.Queue>();
    for (const application of applications) {
      if (!application.source) continue;
      const name = `rct-portfolio-${config.environment}-reporting-${application.name}`;
      const processingDlq = new sqs.Queue(this, `${application.name}ProcessingDlq`, {
        queueName: `${name}-processing-dlq`, retentionPeriod: Duration.days(14),
        encryption: sqs.QueueEncryption.SQS_MANAGED, enforceSSL: true, removalPolicy,
      });
      const deliveryDlq = new sqs.Queue(this, `${application.name}DeliveryDlq`, {
        queueName: `${name}-delivery-dlq`, retentionPeriod: Duration.days(14),
        encryption: sqs.QueueEncryption.SQS_MANAGED, enforceSSL: true, removalPolicy,
      });
      const queue = new sqs.Queue(this, `${application.name}Queue`, {
        queueName: name, retentionPeriod: Duration.days(4), visibilityTimeout: Duration.seconds(181),
        encryption: sqs.QueueEncryption.SQS_MANAGED, enforceSSL: true, removalPolicy,
        deadLetterQueue: { queue: processingDlq, maxReceiveCount: 5 },
      });
      queues.set(application.name, queue);
      const rule = new events.Rule(this, `${application.name}ApprovedEvents`, {
        eventBus: bus, eventPattern: { source: [application.source], detailType: [...application.detailTypes] },
      });
      rule.addTarget(new targets.SqsQueue(queue, {
        deadLetterQueue: deliveryDlq, maxEventAge: Duration.hours(24), retryAttempts: 185,
      }));
      for (const [suffix, dlq] of [["Delivery", deliveryDlq], ["Processing", processingDlq]] as const) {
        new cloudwatch.Alarm(this, `${application.name}${suffix}Failures`, {
          metric: dlq.metricApproximateNumberOfMessagesVisible({ period: Duration.minutes(1), statistic: "Maximum" }),
          threshold: 1, evaluationPeriods: 1,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
          alarmDescription: "Inspect approved reporting failures; notification recipients/actions require separate approval",
        });
      }
      new cloudwatch.Alarm(this, `${application.name}BacklogAge`, {
        metric: queue.metricApproximateAgeOfOldestMessage({ period: Duration.minutes(1), statistic: "Maximum" }),
        threshold: 300, evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
    }
    const consulting = queues.get("consulting");
    const dotcom = queues.get("dotcom");
    if (!consulting || !dotcom) throw new Error("Both approved reporting sources must be configured");
    const table = dynamodb.Table.fromTableName(this, "OwnedProjections", `${config.prefix}-projections`);
    const logGroup = new logs.LogGroup(this, "ReportingLogs", {
      logGroupName: `/rct/${config.prefix}/reporting`,
      retention: production ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.ONE_WEEK, removalPolicy,
    });
    const identity = founderRuntimeIdentity(config, this.partition, "reporting");
    const role = iam.Role.fromRoleArn(this, "ReportingRole", identity.roleArn, { mutable: false });
    const worker = new NodejsFunction(this, "ReportingWorker", {
      functionName: identity.name,
      entry: resolve(import.meta.dirname, "../../apps/reporting-worker/src/index.ts"),
      depsLockFilePath: resolve(import.meta.dirname, "../../package-lock.json"),
      runtime: lambda.Runtime.NODEJS_24_X, handler: "handler",
      memorySize: 256, timeout: Duration.seconds(30), reservedConcurrentExecutions: 4, role, logGroup,
      environment: {
        REPORTING_TABLE_NAME: table.tableName,
        CONSULTING_QUEUE_ARN: consulting.queueArn,
        DOTCOM_QUEUE_ARN: dotcom.queueArn,
      },
      bundling: { minify: true, sourceMap: false, externalModules: [] },
    });
    for (const queue of queues.values()) worker.addEventSource(new SqsEventSource(queue, {
      batchSize: 10, maxBatchingWindow: Duration.seconds(1), maxConcurrency: 2, reportBatchItemFailures: true,
    }));
    new cloudwatch.Alarm(this, "WorkerErrors", {
      metric: worker.metricErrors({ period: Duration.minutes(1), statistic: "Sum" }),
      threshold: 1, evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    new ssm.StringParameter(this, "BusDiscovery", {
      parameterName: `/rct/${config.environment}/portfolio/event-bus-arn`, stringValue: bus.eventBusArn,
    });
    new CfnOutput(this, "EventBusArn", { value: bus.eventBusArn });
    new CfnOutput(this, "ConsultingQueueArn", { value: consulting.queueArn });
    new CfnOutput(this, "DotcomQueueArn", { value: dotcom.queueArn });
  }
}
