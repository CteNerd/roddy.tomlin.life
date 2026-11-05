import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { createHandler } from "./handler.ts";
import { DynamoReportingStore, dynamoTransport } from "./store.ts";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be explicitly configured`);
  return value;
}

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1" }));
export const handler = createHandler(
  new DynamoReportingStore(required("REPORTING_TABLE_NAME"), dynamoTransport(client)),
  new Map([
    [required("CONSULTING_QUEUE_ARN"), "rct.consulting"],
    [required("DOTCOM_QUEUE_ARN"), "rct.dotcom"],
  ]),
);
