import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { createHandler } from "./handler.ts";
import { createProjectionReader } from "./projections.ts";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be explicitly configured`);
  return value;
}

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1" }));
export const handler = createHandler(
  createProjectionReader(required("REPORTING_TABLE_NAME"), (input) => client.send(new QueryCommand(input))),
  required("FOUNDER_OWNER_SUBJECT"),
);
