import type { QueryCommandInput, QueryCommandOutput } from "@aws-sdk/lib-dynamodb";
import { isReportingMonth, ReportingIntegrityError } from "@rct/portfolio-reporting/stored-projection";

type ProjectionQuery = (input: QueryCommandInput) => Promise<Pick<QueryCommandOutput, "Items" | "LastEvaluatedKey">>;

export function createProjectionReader(table: string, query: ProjectionQuery) {
  if (!/^[A-Za-z0-9._-]{3,255}$/.test(table)) throw new Error("An explicit reporting table name is required");
  return async (month: string): Promise<unknown[]> => {
    if (!isReportingMonth(month)) throw new Error("An explicit valid reporting month is required");
    const result = await query({
      TableName: table, KeyConditionExpression: "PK = :month",
      ExpressionAttributeValues: { ":month": `MONTH#${month}` },
      ConsistentRead: true, Limit: 3,
    });
    if (result.LastEvaluatedKey || !Array.isArray(result.Items) || result.Items.length > 2) throw new ReportingIntegrityError();
    return result.Items;
  };
}
