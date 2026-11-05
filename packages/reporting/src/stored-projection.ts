export class ReportingIntegrityError extends Error {
  constructor() { super("Reporting storage failed integrity validation"); this.name = "ReportingIntegrityError"; }
}

export type StoredProjection = {
  PK: string;
  SK: "consulting#inboundLeads" | "dotcom#mentorApprovals";
  total: number;
  version: number;
  latestOccurredAt: string;
  updatedAt: string;
};

export function isReportingMonth(value: unknown): value is string {
  return typeof value === "string" && /^[0-9]{4}-(0[1-9]|1[0-2])$/.test(value);
}

function canonicalInstant(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString() === value;
}

export function parseStoredProjection(input: unknown, month: string): StoredProjection {
  if (!isReportingMonth(month) || input === null || typeof input !== "object" || Array.isArray(input)) throw new ReportingIntegrityError();
  const keys = ["PK", "SK", "total", "version", "latestOccurredAt", "updatedAt"];
  if (Object.keys(input).length !== keys.length || Object.keys(input).some((key) => !keys.includes(key))
    || !("PK" in input) || input.PK !== `MONTH#${month}`
    || !("SK" in input) || (input.SK !== "consulting#inboundLeads" && input.SK !== "dotcom#mentorApprovals")
    || !("total" in input) || typeof input.total !== "number" || !Number.isSafeInteger(input.total)
    || !("version" in input) || typeof input.version !== "number" || !Number.isSafeInteger(input.version) || input.version < 1
    || !("latestOccurredAt" in input) || !canonicalInstant(input.latestOccurredAt)
    || !("updatedAt" in input) || !canonicalInstant(input.updatedAt)) throw new ReportingIntegrityError();
  return {
    PK: input.PK, SK: input.SK, total: input.total, version: input.version,
    latestOccurredAt: input.latestOccurredAt, updatedAt: input.updatedAt,
  };
}
