export function configuration(environment: unknown, account: unknown) {
  if (environment !== "development" && environment !== "production") {
    throw new Error("Explicit development or production environment is required");
  }
  if (typeof account !== "string" || !/^[0-9]{12}$/.test(account)) {
    throw new Error("Explicit 12-digit AWS account is required");
  }
  return {
    environment,
    account,
    region: "us-east-1",
    prefix: `rct-founder-${environment}`,
    authDomainPrefix: `rct-founder-${environment}-${account}`,
    webOrigin: environment === "production" ? "https://roddy.tomlin.life" : "http://localhost:5174",
  } as const;
}

export type Configuration = ReturnType<typeof configuration>;
