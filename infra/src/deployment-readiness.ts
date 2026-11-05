import { applications } from "./governance.ts";

export type DeploymentTarget = {
  repository: string;
  environment: "development" | "production";
  account: string;
  roleArn: string;
};

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function items(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error("Deployment metadata must contain the expected arrays");
  return value;
}

export function validateTarget(target: DeploymentTarget): void {
  if (!applications.some((application) => application.repository === target.repository)) {
    throw new Error("Repository is not in the approved portfolio");
  }
  if (target.environment !== "development" && target.environment !== "production") {
    throw new Error("An explicit development or production environment is required");
  }
  if (!/^[0-9]{12}$/.test(target.account)
    || !new RegExp(`^arn:aws:iam::${target.account}:role/(?:[A-Za-z0-9+=,.@_-]+/)*[A-Za-z0-9+=,.@_-]+$`).test(target.roleArn)) {
    throw new Error("Deployment role must belong to the explicit target account");
  }
}

export function verifyEnvironment(target: DeploymentTarget, environment: unknown, branches: unknown): void {
  validateTarget(target);
  if (!record(environment) || environment.name !== target.environment
    || !record(environment.deployment_branch_policy)
    || environment.deployment_branch_policy.custom_branch_policies !== true
    || environment.deployment_branch_policy.protected_branches !== false) {
    throw new Error("Environment must have an explicit main-only deployment branch policy");
  }
  if (!record(branches)) throw new Error("Deployment branch inventory is missing");
  const policies = items(branches.branch_policies);
  if (branches.total_count !== policies.length || policies.length !== 1 || !record(policies[0])
    || policies[0].name !== "main" || policies[0].type !== "branch") {
    throw new Error("Only the main branch may deploy; tags and wildcard branches are forbidden");
  }
  if (target.environment === "production") {
    const rules = items(environment.protection_rules);
    const approvals = rules.filter((rule) => record(rule) && rule.type === "required_reviewers");
    const approval = approvals[0];
    if (environment.can_admins_bypass !== false || approvals.length !== 1
      || !record(approval) || !items(approval.reviewers).some((entry) => (
        record(entry) && (entry.type === "User" || entry.type === "Team")
        && record(entry.reviewer) && Number.isSafeInteger(entry.reviewer.id)
        && typeof entry.reviewer.id === "number" && entry.reviewer.id > 0
      ))) {
      throw new Error("Production deployment requires enforced environment reviewer approval");
    }
  }
}

export function verifyTrust(target: DeploymentTarget, document: unknown): void {
  validateTarget(target);
  if (!record(document)) throw new Error("OIDC trust policy is missing");
  const statements = items(document.Statement);
  if (statements.some((statement) => !record(statement) || !["Allow", "Deny"].includes(String(statement.Effect)))) {
    throw new Error("OIDC trust contains malformed statements");
  }
  const allowed = statements.filter((statement) => record(statement) && statement.Effect === "Allow");
  if (allowed.length !== 1) throw new Error("OIDC role must have exactly one approved trust grant");
  const statement = allowed[0];
  if (!record(statement) || !record(statement.Principal)
    || Object.keys(statement.Principal).length !== 1
    || statement.Principal.Federated !== `arn:aws:iam::${target.account}:oidc-provider/token.actions.githubusercontent.com`
    || (statement.Action !== "sts:AssumeRoleWithWebIdentity"
      && !(Array.isArray(statement.Action) && statement.Action.length === 1 && statement.Action[0] === "sts:AssumeRoleWithWebIdentity"))
    || !record(statement.Condition) || !record(statement.Condition.StringEquals)
    || statement.Condition.StringEquals["token.actions.githubusercontent.com:aud"] !== "sts.amazonaws.com"
    || statement.Condition.StringEquals["token.actions.githubusercontent.com:sub"] !== `repo:${target.repository}:environment:${target.environment}`) {
    throw new Error("OIDC trust must match the exact repository, environment, provider and audience");
  }
}

export function verifyCaller(target: DeploymentTarget, identity: unknown): void {
  validateTarget(target);
  const roleName = target.roleArn.split("/").at(-1);
  if (!record(identity) || identity.Account !== target.account
    || typeof identity.Arn !== "string"
    || !identity.Arn.startsWith(`arn:aws:sts::${target.account}:assumed-role/${roleName}/`)
    || identity.Arn.endsWith("/")) {
    throw new Error("AWS caller is not the expected short-lived target role");
  }
}
