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
deletion protection. The API writes only its explicit log group (7 days dev,
30 days prod) and can Query only its owned monthly projection partitions. It
cannot read receipts/source tables, Scan, mutate data or publish events.
It exposes safe `GET /health`, JWT-protected `GET /me` and owner-only
`GET /metrics?month=YYYY-MM`. Metrics require an exact configured Cognito
subject and access token, not just authenticated membership.

`FounderOwnerSubject` defaults explicitly to `disabled`; there is no anonymous
or first-user bootstrap. After the owner is invited into the MFA-required pool,
verify its exact subject and review that parameter change separately per
environment. CDK supplies the Lambda environment, not frontend/GitHub secrets.
The API imports its governance-owned runtime role, so reviewed governance
must exist before the foundation is eventually provisioned.
See the [read-only API runbook](../apps/api/README.md).

No hosted login domain, initial users or Founder login/dashboard UI is
implemented yet. The separate offline eventing stack is described below. Production CORS is the existing profile
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
yet.** Boundaries cap permissions; they do not grant them unless separately
attached as identity policies. The owner selected governance-owned Founder
runtime IAM rather than allowing application execution to create/manage roles.
Do not equate this slice with completed deployment IAM.

### Governance-owned Founder runtime IAM

Governance pre-creates `rct-founder-<environment>-api` and
`rct-founder-<environment>-reporting` under `/rct/founder/<environment>/runtime/`,
each trusted only by Lambda. Each has a dedicated `<role-name>-runtime-boundary`
under `/rct/founder/<environment>/`. The same reviewed managed policy is attached
as its identity grant and its permissions boundary:

- API: only its explicit API log streams and Query on the exact projection
  table, requiring present `dynamodb:LeadingKeys` matching `MONTH#????-??`.
  No worker writes, receipt reads, queue consumption, Scan or publishing.
- Worker: only its reporting log streams, GetItem/PutItem on the exact projection
  table and consumption of the two exact main reporting queues. No Query/Scan,
  source tables, DLQs, event publishing or IAM authority.

The earlier general Founder upper-bound policy is preserved for compatibility
but is not attached to either role. Producer boundaries/planners are unchanged.
Application stacks import the fixed roles with `mutable: false`; grants cannot
silently create app-owned IAM policies or expand queue resource policies.
Their Lambda names are now fixed to the corresponding role names. Tests verify
both actual templates have zero IAM role/policy resources and the correct pair.

This stronger ownership split avoids granting application execution any IAM
role creation, trust update, policy attachment or boundary mutation privileges.
Runtime trust/capability changes belong in a separate reviewed governance
change set by the approved bootstrap operator. Never deploy governance with an
application role or remove its roles/boundaries to roll back application code.
All resources remain undeployed; inspect name collisions/actual IAM before
bootstrap. These source-only naming changes must not be used to replace an
already-running Lambda/role without a reviewed migration.

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

## Isolated Founder release preparation

The existing shared `CDKToolkit` execution role was verified read-only to have
`AdministratorAccess`. It remains unchanged and must not be reachable from the
new repository workflows. Founder foundation and eventing now use CDK's
`CliCredentialsStackSynthesizer`: their actual Lambda/template asset manifests
target only the separate environment/account/region-qualified
`rct-founder-<environment>-release-assets-<account>-us-east-1` bucket under
`release/`, using the caller's credentials. There are no shared bootstrap
assume-role, lookup-role, execution-role or version-parameter references.
The existing profile publisher and producer synths are unchanged.

```sh
npm run cdk:synth:release-planning:development
npm run cdk:synth:release-planning:production
```

These commands remain offline/synthetic-account validation, not provisioning.
The separate `rct-founder-<environment>-release-planning` stack defines:

- A private, TLS-only, SSE-S3, versioned asset bucket, retained in both
  environments; no automatic deletion or expiry of rollback assets.
- `rct-founder-<environment>-release-plan`, trusted only for the exact personal
  repository/environment OIDC subject and audience. It can upload/read only
  `release/*`, list only its dedicated bucket, inspect its own IAM trust and
  prepare/read/delete change sets for exactly the Founder foundation and
  that environment's portfolio eventing stack. It cannot manage governance,
  release-planning, producer or existing profile stacks.
- `rct-founder-<environment>-execute-api` and
  `rct-founder-<environment>-execute-reporting`, trusted only by CloudFormation.
  Each has its own managed policy attached as both identity grant and
  permissions boundary. The API role is limited to the Founder projections
  table, Founder-tagged Cognito pool, API Lambda/log group and API Gateway
  management paths. Table grants include the continuous-backup operations
  required to configure and read production PITR; Cognito grants include MFA
  configuration and require the `Application=Founder` tag on create and use.
  The reporting role is limited to the reporting Lambda/log group, the
  portfolio bus and explicitly named rules, the exact six queues, event-source
  mappings for that worker, seven explicitly named alarms and the bus-discovery
  parameter. Each can inspect and pass
  only its paired runtime role to its exact Lambda function. Neither can
  create/edit/delete IAM identities, policies or boundaries.
- The planner's `CreateChangeSet` grant pairs the API execution role only with
  the Founder foundation stack and the reporting execution role only with that
  environment's eventing stack. API Gateway IDs are AWS-generated, so the API
  role is constrained to 10-character API IDs in `us-east-1`; the exact stack
  template and reviewed change set remain essential controls. Lambda IAM has
  no valid `lambda:SourceArn` condition key (Access Analyzer rejects it), so
  the API execution role limits `AddPermission` to the exact API Lambda and
  `apigateway.amazonaws.com`; inspect its three route-specific permission
  resources in every real change set.
- Both execution boundaries allow only region-conditioned
  `logs:DescribeLogGroups` discovery on `Resource: *`; log-group mutations
  remain scoped to their exact group. API Gateway tag reads/writes/deletes use
  the encoded tag endpoint scoped to the same 10-character Founder API ID.
- An explicit planner deny of `sts:AssumeRole`, change-set execution and direct
  stack create/update/delete/rollback/policy mutation. No deploy/assume-role
  fallback to the broad local user or shared CDK roles is allowed.

**This is release preparation, not a completed deployment role chain.** No new
OIDC workflow or AWS resources are activated. Provisioning this separate stack
requires a reviewed real-account assembly and approved administrative bootstrap
change set; the repository planner cannot bootstrap or update its own access.
Governance and release-planning must exist before eventual application
deployment. Imports are not automatic CloudFormation dependencies.

After bootstrap, verify the exact short-lived planner with `check:deployment`
and inspect its policies. CDK supports `--method prepare-change-set`; supply
`--role-arn` with the exact stack-output execution ARN paired to the stack.
Omitting it or using the other stack's role must fail the IAM condition, and
neither `cdk deploy`'s default executing method nor `ExecuteChangeSet` is
permitted. Initial CREATE change sets can leave an unexecuted
`REVIEW_IN_PROGRESS` stack; review those placeholders explicitly. No live
change set or service call is claimed by offline synthesis. IAM Access Analyzer
reports no findings for the candidate boundaries, and custom-policy simulation
checks supported resource/action cases with an extra `Allow *` identity policy.
The simulator did not validate Cognito user-pool creation or Lambda
event-source-mapping creation, even with broad simulated allows; those calls
still need real development change-set verification.

The source now defines service-specific application execution permissions, but
they remain undeployed and must be verified against a real development
change-set plan, CloudFormation service calls and Lambda pass-role context.
Offline assertions, Access Analyzer and custom-policy simulation do not prove
those calls. Do not
broaden these roles or reuse `AdministratorAccess` to make deployment pass.
Separate reviewed bootstrap authority, cost/notification verification, cloud
IAM allow/deny tests and smoke/rollback evidence remain prerequisites.
Production also requires tested protected-environment approval and separate
authorization; the owner has approved development preparation only.

## Separate reporting/eventing stack

`npm run cdk:synth:eventing:development` and the production equivalent synthesize
the separate `rct-portfolio-<environment>-eventing` stack. It creates the custom
bus `rct-portfolio-<environment>` and publishes its ARN through
`/rct/<environment>/portfolio/event-bus-arn`. There is no cross-account bus
policy or active producer publisher. Each producer's rule matches only its
approved source and two v1 detail types; the worker independently validates the
complete schema and delivery account/region/queue/source.

Each source has an encrypted, TLS-only main queue, EventBridge delivery DLQ and
worker processing DLQ. Main retention is four days; both DLQs retain fourteen.
EventBridge retries at most 185 times within 24 hours; processing redrives after
five receives. The 181-second visibility timeout covers six 30-second Lambda
timeouts plus its one-second batching window. Partial batch responses isolate
poison messages. Each mapping has concurrency two; Lambda reserves four.

The worker imports the existing Founder projection table by name; it does not
redeclare it or touch source tables or live hosting. Its role allows only
GetItem/PutItem on that exact table, consumption of the two exact main queues
and writes to its explicit log group. The role is imported immutably from governance and uses its separate worker
boundary, not the broader compatibility policy. **Review and provision
governance and the Founder foundation before any eventual eventing deployment.**
These external prerequisites are not automatic CloudFormation dependencies.
Both environments are still source-only and no write deployment roles exist.

Seven alarms per environment cover both delivery/processing DLQs, both backlog
ages and Lambda invocation errors. They deliberately have **no notification
actions** pending recipient approval; do not treat them as operational alert
delivery. Partial-batch failures surface through safe logs, backlog and DLQs,
not necessarily the Lambda invocation-error metric. Configure recipients and
prove receipt before activation. At a planning rate of $0.10/standard alarm,
fourteen alarms would add approximately $1.40/month across both environments,
before free-tier allowances; verify current pricing and total budget first.

See the [worker runbook](../apps/reporting-worker/README.md) for transaction,
integration-test and replay/rollback requirements. Production queues/bus/logs
are retained; do not remove/recreate the table or delete deduplication receipts
to recover a release. No event archive or automatic replay is configured.
