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
