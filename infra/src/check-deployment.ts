import { execFileSync } from "node:child_process";
import { configuration } from "./config.ts";
import { validateTarget, verifyCaller, verifyEnvironment, verifyTrust, type DeploymentTarget } from "./deployment-readiness.ts";

const config = configuration(process.env.DEPLOY_ENVIRONMENT, process.env.AWS_ACCOUNT_ID);
const repository = process.env.DEPLOY_REPOSITORY;
const roleArn = process.env.AWS_DEPLOY_ROLE_ARN;
if (!repository || !roleArn) throw new Error("DEPLOY_REPOSITORY and AWS_DEPLOY_ROLE_ARN are required");
if (process.env.AWS_REGION !== config.region) throw new Error("AWS_REGION must explicitly be us-east-1");
const target: DeploymentTarget = { repository, roleArn, environment: config.environment, account: config.account };
validateTarget(target);
function json(command: string, args: string[]): unknown {
  return JSON.parse(execFileSync(command, args, { encoding: "utf8", maxBuffer: 1024 * 1024 }));
}
const endpoint = `repos/${repository}/environments/${config.environment}`;
verifyEnvironment(
  target,
  json("gh", ["api", "--hostname", "github.com", endpoint]),
  json("gh", ["api", "--hostname", "github.com", `${endpoint}/deployment-branch-policies`]),
);
verifyCaller(target, json("aws", ["sts", "get-caller-identity", "--region", config.region, "--output", "json", "--no-cli-pager"]));
const role = json("aws", ["iam", "get-role", "--role-name", roleArn.split("/").at(-1)!, "--output", "json", "--no-cli-pager"]);
if (role === null || typeof role !== "object" || !("Role" in role)
  || role.Role === null || typeof role.Role !== "object" || !("AssumeRolePolicyDocument" in role.Role)
  || !("Arn" in role.Role) || role.Role.Arn !== roleArn) {
  throw new Error("IAM role inventory did not contain a trust policy");
}
verifyTrust(target, role.Role.AssumeRolePolicyDocument);
console.log(`Deployment identity/environment preflight passed for ${repository}/${config.environment}; execution permissions and smoke evidence still require separate verification.`);
