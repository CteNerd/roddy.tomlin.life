# Founder infrastructure foundation

This stack is additive and undeployed. It does not own or modify the live
profile's existing CloudFormation hosting stack. No public Founder UI, duplicate
CDN/bucket, broad SPA fallback or source-business database access is added.

From the repository root, Node 24/npm 11.6.2:

```sh
npm ci --no-audit --no-fund
npm run lint
npm run check:portfolio
npm run cdk:synth:development
npm run cdk:synth:production
```

Synthesis is offline with explicit synthetic account `123456789012`; never
deploy that assembly. Real deployment requires explicit reviewed account and
environment context, scoped IAM/bootstrap review and change-set approval.
Region is `us-east-1`; invalid/missing context throws rather than guessing.

Per-environment resources are an on-demand reporting-projections table,
invitation-only Cognito with required authenticator MFA, Node 24 Lambda and
HTTP API. Production data/auth resources are retained; the table has PITR and
deletion protection. Lambda can only write its explicit log group (7 days dev,
30 days prod), not read/write tables or publish events. It exposes safe
`GET /health` and JWT-protected `GET /me`; there are no fake metrics or mutation
routes. Reporting read grants belong with real projection-read implementation.

No hosted login domain, initial users, event bus, queues, durable consumer or
business metrics are implemented yet. Production CORS is the existing profile
origin; development is loopback until its approved hostname is selected.
Callback/logout client configuration is not a working login UI.

New deployment automation remains blocked on reviewed repo/environment OIDC
roles, restricted CloudFormation execution/pass-role, protected production
approval and end-to-end notification/smoke/rollback checks. Do not copy broad
local AWS credentials or store keys in GitHub. Future environment inputs are
`AWS_ACCOUNT_ID`, `AWS_REGION`, `AWS_DEPLOY_ROLE_ARN`, and validated smoke URLs.
Existing profile publishing workflows remain unchanged and manual.

Rollback through checked revert PRs and reviewed CDK diffs/change sets, then
redeploy the last approved revision. Never delete retained tables, identities,
existing hosting stacks or records as a rollback shortcut. Test PITR and auth
recovery before production; retention alone is not a restore rehearsal.

Only infrastructure disables `exactOptionalPropertyTypes` for CDK's optional
interface declarations; strict TS remains. Current CDK/ESLint tooling carries
the upstream moderate minimatch advisory. CI reports all findings and blocks
high/critical severity; no forced incompatible downgrade or advisory ignore.

## Governance planning and identity preflight

`npm run cdk:synth:governance:development` and the production equivalent synthesize
a separate governance stack offline. It imports the existing GitHub OIDC provider
and defines three planning roles per environment. Trust matches the exact
repository, environment and `sts.amazonaws.com` audience. Planners can read only
their own environment's named app stacks and their own IAM role metadata.
They cannot assume CDK bootstrap roles, pass roles, execute change sets, modify
IAM, read databases or deploy applications. They do not manage the separate bus.

Runtime managed policies define upper bounds for each app's own table/log
namespace. Producers additionally have only their source/version allowlist on
the exact environment bus; Founder has reporting-queue receive permissions,
not event publishing or source-table access. **These policies are not deployed
or attached yet.** Boundaries cap permissions; they do not grant them. Future
execution-role creation must require the exact boundary, prohibit its removal
and restrict pass-role. Do not equate this slice with completed deployment IAM.

For an existing, configured environment, `npm run check:deployment` performs
read-only GitHub, STS and self-role inventory. Required environment inputs:
`DEPLOY_REPOSITORY`, `DEPLOY_ENVIRONMENT`, `AWS_ACCOUNT_ID`, `AWS_REGION` and
`AWS_DEPLOY_ROLE_ARN`. It rejects unapproved repos/accounts, wildcard/tag branch
policies, truncated inventory, broad local identities, wrong sessions or OIDC
trust. Production also requires actual reviewer approval with admin bypass
disabled. Missing environments/API entitlement errors fail explicitly.

This checks identity and environment controls, **not deployment permission
completeness or operational readiness**. The calling role needs self-scoped
`iam:GetRole` for trust verification; planners include it. Scoped execution/
publisher roles, cost-tag activation, approved budget amounts/recipients and
notification receipt, live allow/deny tests and restore/smoke rehearsal remain
required before enabling write workflows. No AWS resources are applied here.
