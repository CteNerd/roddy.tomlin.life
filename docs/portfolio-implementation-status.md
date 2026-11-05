# Portfolio implementation status

Updated: 2026-11-05, merged release preparation and governance-owned runtime IAM.
Scope: three existing repos, all defaulting to `main`. The owner elected public
visibility; the public profile build boundary does not certify legacy source or
Git history for publication. Application increments are merged. This update
records GitHub configuration and source-only release preparation; no AWS or DNS
writes have been performed.

## Completed and changed files

- **Personal / Founder:** architecture [ADR](adr/0001-portfolio-integration.md),
  [contracts](../packages/contracts/README.md), [reference reducer](../packages/reporting/README.md),
  [pin synchronization](../scripts/sync-portfolio-contracts.mjs), root workspace
  manifests/lockfile, README, `.gitignore`, and checks/manual-publish workflows.
- **Each producer:** domain/release ADR, README, `.nvmrc`, root manifests/lockfile,
  `.github/workflows/ci.yml`, `.gitignore`, pinned `packages/contracts/` and
  `packages/contracts.lock.json`. The generated tracked `.eslintcache` is removed
  from Git while remaining available locally.
- **Review fix:** leap seconds are rejected in domain/delivery timestamps before
  publishing or replay. Regression tests reproduced the prior `RangeError`.
  Both producer pins now reference authority commit
  `fbefd7e0532aaed988664ad9a1b441d21ef9d9c4`.
- Lockfiles remain versioned. Their large producer diffs include npm v1-to-v3
  format conversion, the necessary CRA 4.0.1-to-4.0.3 peer-compatibility patch,
  and real transitive dependency resolution changes, not just formatting.
  Cache files are not dependency lockfiles and should not be tracked.

### New application-foundation files

- **All three:** `apps/api/{package.json,tsconfig.json,src/handler.ts,src/handler.test.ts}`,
  `tsconfig.foundation.json`, `infra/{package.json,cdk.json,tsconfig.json,README.md}`,
  `infra/src/{app.ts,config.ts,stack.ts,stack.test.ts}`, root manifests/lockfile
  and ignores. API routes are safe health plus Gateway-JWT-bound own identity.
- **Producers:** `apps/web/` typed React/Vite previews, responsive styles, branding,
  tests; `packages/domain/` assignment/finance segregation policies and tests;
  `infra/eslint.config.mjs`, READMEs and expanded `.github/workflows/ci.yml`.
  Legacy CRA source and commands remain; previews are not replacement parity.
- **Personal:** TS lint integration, expanded `.github/workflows/checks.yml` and
  README. Existing public application and manual publisher files are unchanged.
- Scoped lockfile patches and ESLint 7 minimatch/semver overrides fix high
  advisories in legacy peers reached by the modern lint dependency graph.
  Moderate upstream minimatch findings remain and are explicitly reported.
- Actual business authorization is not complete: policies are unit tested, but
  no CRUD endpoints or trusted-record loaders exist. No enrollment opens.

### Governance planning slice

- Both producer HTTPS issuer fixes are merged after successful CI and Copilot
  reviews. Founder was fixed in its merged foundation PR.
- `infra/src/governance.ts` defines separate read-only OIDC planning roles and
  runtime upper-bound policies for all three apps in each environment; existing
  OIDC is imported, not recreated. No role/policy is applied or attached.
- `deployment-readiness.ts`, `check-deployment.ts` and governance tests enforce
  exact repo/environment/audience trust, short-lived caller identity, main-only
  environment branches and production reviewer approval without admin bypass.
  CLI reads existing metadata and fails closed; it does not deploy.
- A live production preflight correctly stopped at the missing `production`
  GitHub environment (HTTP 404), before attempting AWS identity/role inventory.
- Governance synth scripts and CI cover both environments. This is partial P3:
  no infrastructure write/CloudFormation execution roles, publisher activation,
  budget notifications or cloud permission/restore rehearsals are completed.

### Verified GitHub controls

- All three `main` branches require PRs, up-to-date GitHub Actions-bound checks,
  resolved review conversations and administrator enforcement. Force pushes
  and branch deletion are disabled. Solo-maintainer configuration does not
  require an unavailable second human approval; Copilot review remains part
  of the documented review process.
- Both environments in all three repos now use one explicit deployment
  **branch** policy: `main`. No tags, wildcards or implicit
  "protected branches only" selection are allowed.
- The owner approved removing human/latest-push/extra-unattributed approval
  requirements from the new `main` rulesets for sole-maintainer operation.
  Automatic Copilot reviews, conversation resolution, force-push/deletion
  protections and the producers' signed-commit requirements remain unchanged.
- All three production environments preserve the configured owner reviewer
  with self-review allowed for the sole operator. Administrator bypass is now
  disabled. Configuration does not prove actual workflow approval enforcement
  or authorize production deployment.
- The repository's environment-only validator passes for all six development/
  production environments. This does not prove OIDC role assumption, write permissions,
  actual workflow approval enforcement or deployment readiness.
- Existing profile publishing environments/workflows were not changed.
- The owner reports the legacy Google key is no longer valid. Provider-side
  revocation was not independently verified; copies remain in three legacy
  files and history. Do not publish a replacement or treat this as a full
  public-source/history review.

### Isolated Founder release-preparation slice

- Read-only AWS inventory verified existing `CDKToolkit` version 30 and its
  CloudFormation execution role's attached `AdministratorAccess`. No shared
  bootstrap role, trust, policy or bucket is changed or granted to new CI.
- `infra/src/release-planning.ts` and its tests add separate per-environment
  private/versioned/retained asset storage, exact repository/environment OIDC
  release planners and a CloudFormation-only execution identity, initially with
  asset reads only and now boundary-constrained as described below. Planners can prepare change sets for exactly Founder foundation
  and portfolio eventing, passing only that exact execution role.
- Founder `stack.ts` and `eventing.ts` use current-credential CDK synthesis with
  Lambda/template assets confined to those separate buckets and `release/`.
  Actual assembly tests check that shared bootstrap assumptions and version
  lookups are absent; runtime routes, grants and application resources remain
  unchanged. Root/infra scripts and `checks.yml` add both release-planning synths.
  Dependency resolution is unchanged; no lockfile regeneration is required.
- Planners explicitly cannot assume roles, execute change sets or directly
  create/update/delete/roll back stacks. This is a release-preparation slice,
  **not working deployment authority**. Service-specific execution permissions,
  reviewed runtime ownership/pass-role controls, live IAM proof and notification/
  smoke/recovery gates remain before deploying any application.
- The [infra runbook](../infra/README.md#isolated-founder-release-preparation)
  documents reviewed bootstrap prerequisites and non-executing change-set use.
  No AWS stack, asset bucket, role or deployment workflow has been activated.
- Local validation passes lint, infrastructure type checking, 14 infrastructure
  tests (including four new policy/actual-assembly cases) and all six affected
  offline synths. AWS's read-only custom-policy simulator also passed 28
  development-model action/resource decisions: own-stack preparation and own
  asset writes allow; unrelated/prod resources, absent/wrong pass-role context,
  shared bootstrap assumptions and execution/delete attempts deny. Simulation
  is not an assumed deployed-role, service-integration or real approval test.

### Governance-owned runtime and execution-boundary slice

- Personal PR #7 is merged; local main was synchronized before this feature
  branch. The owner selected governance pre-creation of Founder runtime roles
  instead of widening application execution's IAM management permissions.
- `infra/src/governance.ts` now defines separate Lambda-only API/worker roles,
  each with a narrowly scoped managed policy attached as both identity grant
  and boundary. API has present-key monthly Query only; worker has only owned
  projection GetItem/PutItem, two main queues and its own logs. The broader
  compatibility upper bound is retained but not attached to these roles.
- `stack.ts` and `eventing.ts` immutably import those exact role ARNs and use
  fixed paired Lambda names. Their actual templates have no IAM role/policy
  resources. Governance must exist first; runtime trust/boundary/policy changes
  require separate approved bootstrap ownership, not application execution.
- `release-planning.ts` attaches a dedicated execution boundary as both identity
  grant and cap: release-asset reads, metadata reads of the two runtime roles
  and each exact role's Lambda/function-associated pass-role only. The executor
  cannot create/edit/delete IAM identities, policies or boundaries. Service
  deployment permissions remain absent and planner execution stays denied.
- Governance/foundation/eventing/release-planning template tests and infra/API/
  worker runbooks are updated. No dependency or lockfile resolution changed.
  No AWS/DNS resource or privileged workflow is activated. Live role assumption,
  service-provided pass-role context, notifications and smoke/recovery still
  need proof before any application deployment.
- Validation: local lint, infrastructure type checking, 16 infrastructure tests
  and all eight affected offline synths pass. Read-only IAM custom-policy
  simulation passed 140 resource-specific decisions across both environment
  models, including tests with an extra Allow-* identity policy: API writes/
  receipt reads, cross-scope resources, IAM mutations, unpaired/absent pass-role
  context, bootstrap assumptions and application execution still deny. This
  proves generated policy semantics, not live role/service/approval enforcement.

### Durable reporting slice

- `apps/reporting-worker/` adds the typed SQS consumer, narrow DynamoDB adapter,
  conditional two-item receipt/projection transactions, unit/bundle tests,
  mandatory real DynamoDB Local integration tests and recovery runbook.
  Receipts have no TTL; matching duplicates are safe after a lost response,
  while reused IDs with changed facts fail. Poison messages are isolated.
- Shared `prepareReportingEvent` reuses strict contracts/fingerprints/metric
  contributions in the reference reducer and worker. Fact-time comparisons
  use numeric instants, including offsets crossing four-digit year boundaries.
  JSON schema is imported as a module and embedded in the Lambda bundle.
  Producer PR #4s now pin the reviewed authority revision
  `fbefd7e0532aaed988664ad9a1b441d21ef9d9c4` after completed Copilot reviews and
  green hosted CI; event schemas/semantics are unchanged.
- `infra/src/eventing.ts` and tests add the separate per-environment bus,
  source/type-filtered rules, two main queues, four separate delivery/processing
  DLQs, bounded Lambda concurrency/retry/visibility, explicit logs, seven alarms
  and SSM bus discovery. No source table, public frontend or DNS is modified.
- The worker references the existing Founder table and governance boundary;
  its actual grants are only that table's GetItem/PutItem, two exact queue
  consumption permissions and own logs. The boundary queue allowlist is also
  tightened to those exact queues, adding required GetQueueUrl.
- Root manifests/lockfile, lint/check scripts, infra scripts and
  `.github/workflows/checks.yml` cover the worker and both eventing synths.
  Separate hosted integration uses the official digest-pinned DynamoDB Local
  image, loopback-only access and synthetic credentials, never AWS writes.
  Local Docker/Java are unavailable; hosted integration is a required merge
  gate, not silently skipped or replaced by mocks.

### Owner-only read API slice

- Personal reporting PR #4 is merged. Actual hosted DynamoDB Local integration
  passed its four transaction/replay scenarios with no skips; review's request
  to confirm that job was answered with exact-head evidence before merge.
- `apps/api/src/{index.ts,handler.ts,projections.ts}` and tests define
  `GET /metrics?month=YYYY-MM`. Backend requires the exact configured Cognito
  owner subject and an access token after Gateway JWT validation. Other users,
  ID tokens and headers cannot trigger database reads.
- `FounderOwnerSubject` is a CloudFormation parameter defaulting explicitly to
  `disabled`; no user is automatically authorized or invited. Select/verify
  the owner in each MFA-required pool before a reviewed parameter activation.
- The API role uses the governance runtime boundary and only Query on the
  owned table's monthly partitions, not receipts/source data, Scan or writes.
  Shared `packages/reporting/src/stored-projection.ts` validates persistent
  rows for both API and worker, including safe totals/versions and timestamps.
- Strict responses contain approved aggregate fields only; empty observations
  are an empty array, not zero totals. Storage faults return explicit 503s with
  sanitized diagnostics. The real integration job additionally tests the
  actual API query against worker-written and empty months.
- API/worker/infra runbooks and manifests/lockfile are updated. The existing
  profile, public build/hosting and routes remain unchanged; no Founder UI or
  login flow is published. This is partial P5, not a production-ready dashboard.

## Confirmed domains and outstanding DNS/certificates

| App | Production web | Development web | Production API |
| --- | --- | --- | --- |
| Consulting | `thirddowntech.com` | `dev.thirddowntech.com` | `api.thirddowntech.com` |
| Community | `cutblock.org` | `dev.cutblock.org` | `api.cutblock.org` |

The previous read-only AWS inventory confirmed auto-renew enabled and
both public hosted zones exist. At that inventory each contained NS/SOA records
only; no matching ACM certificate was returned in `us-east-1`.

Reuse those zones; validate public delegation before deployment. Provision
DNS-validated ACM certificates in `us-east-1` for the CloudFront web names and
regional API custom names. Add only reviewed certificate-validation and explicit
app/API alias records. Never replace zone delegation or unrelated records.
Use generated API Gateway URLs for development initially; no development API
custom hostname has been approved. The personal site's existing domain and
hosting remain unchanged; its development hostname is still to be selected.
Registration does not establish legal brand clearance or authorize public cutover.

## Infrastructure implemented in source, not deployed

Per environment, producer CDK stacks define private S3/CloudFront OAC, HTTP
API/Node 24 Lambda, invitation-only Cognito with authenticator MFA, an on-demand
core table and logs-only runtime IAM. Production tables have PITR/deletion
protection/retention. Default synth creates no DNS records/certificates or uploads.
Opt-in domains import existing zones; production requires explicit cutover flag
in addition to mandatory deployment approval. See each `infra/README.md`.
Development and production do not share tables/auth.

Founder foundation defines auth/API/projections: it does not redeclare profile
hosting. Its API has only an owner-gated Query route on monthly reporting
partitions, with no writes or source-data access. Separate offline
eventing now defines bus/SQS/DLQs/consumer and alarms; only its worker has access
to the owned projections table. Governance and the table must exist before
eventing is eventually provisioned. Alarm notification actions/recipients,
private documents, producer outboxes and granular business handlers remain
future work; no producer event publishing is activated.
No unnecessary VPC, NAT, always-on server or RDS. Preserve the existing profile
CloudFormation stack and all existing applications until replacements pass.

Community's preview roadmap includes technology, AI, mentorship, athletic training,
fitness and future facilities; only the approved adult tech/mentorship pilot
is planned first. No enrollment or pilot operations are enabled by this increment.
Youth enrollment requires reviewed safety/guardian consent. Backend APIs must
enforce assignment policies before introducing business routes; no contributor
or mentor is granted finance, contracts or unrelated records here.

## Required GitHub configuration and IAM

New environment names: **`development`** and **`production`**; earlier
plans called development "staging". No existing stack/environment is renamed.
Check actual defaults when configuring triggers; all three currently use `main`.

| Environment variables | Source / purpose |
| --- | --- |
| `AWS_ACCOUNT_ID`, `AWS_REGION` | Verified shared account, `us-east-1`; assert identity before writes. |
| `AWS_DEPLOY_ROLE_ARN` | Exact repo/environment-scoped infrastructure role. |
| `WEB_DOMAIN_NAME`, `API_DOMAIN_NAME`, `HOSTED_ZONE_ID` | Domains/zones above; omit an unapproved development API domain, use deployed output. |
| `PORTFOLIO_BUS_SSM_PATH` | `/rct/<environment>/portfolio/event-bus-arn`; producer discovery only. |
| `SMOKE_WEB_URL`, `SMOKE_API_URL` | Validated stack outputs / approved domains. |
| `BRAND_LAUNCH_APPROVED` | Explicit production clearance gate, not a substitute for legal review. |

Certificates, Cognito public client IDs and asset destinations can be stack
outputs rather than duplicated inputs. Secrets belong in backend secret stores,
not frontend config. Never add AWS access keys to GitHub secrets.
The worker's `REPORTING_TABLE_NAME`, `CONSULTING_QUEUE_ARN` and `DOTCOM_QUEUE_ARN`
are populated by CDK, not manually copied into GitHub variables or secrets.
CDK similarly populates API `REPORTING_TABLE_NAME` and `FOUNDER_OWNER_SUBJECT`
from the owned table and disabled-by-default reviewed owner parameter.

Required roles: six app OIDC deploy roles (3 repos x 2 environments), separate
bus deploy authority per environment, constrained CloudFormation execution/
bootstrap roles, narrow static publishers, per-handler runtime roles, source
outbox publishers and Founder consumer/read-only API roles. Existing profile
publisher stays narrowly scoped. Review the complete assume-role/pass-role chain;
no broad local bootstrap identity is copied to CI or app profiles.

## Validation and release blockers

- **Passing locally:** Consulting 16 tests, Community 15, Personal/Founder 64
  including its 22 existing profile tests and 12 worker unit/bundle tests.
  All workspace type checks and new
  source lint pass; both new web builds and the personal 10-file release boundary
  pass. All six Founder foundation/governance/eventing synth commands, plus
  both producer environments' foundation synths, pass with real local
  Lambda bundling and explicit synthetic account, without AWS lookups.
  Infrastructure alone relaxes exact-optionals for CDK declaration compatibility;
  strict TS remains and API/domain exact-optionals remain enabled.
- Both producer previews were browser-checked on loopback at desktop and
  390-pixel mobile width: anchor navigation works, no horizontal overflow/forms,
  and the closed-enrollment/youth-safety messaging remains visible.
- Dependency gates use high severity. Current selected-workspace audits report
  no high/critical findings, but 10 moderate package entries per producer and 11
  personal entries from upstream minimatch. No advisory is suppressed or
  incompatible downgrade forced; the preserved CRA application is not certified.
- GitHub push warnings still report critical/high advisories on the producers'
  legacy default-branch dependency graphs. Passing scoped modern-workspace
  checks is not a clean whole-repository audit or clearance of the old apps.
- Hosted validation must pass on each PR's latest head before merge; an older
  successful run does not substitute for validation of the current revision.
- **Not implemented/tested:** live frontend/API integration, backend business
  authorization, deployment smoke, durable producer outboxes, Cognito login UI,
  cloud event delivery/recovery, notification receipt or rollback/restore rehearsal.
  Template assertions and mocked identity events do not prove live JWT behavior.
- **GitHub:** the earlier branch-protection entitlement error no longer blocks
  current configuration. Branch protections and main-only controls are verified;
  production has its owner reviewer with administrator bypass disabled.
  Actual workflow approval still needs testing. Manual dispatch alone is not
  an equivalent substitute, and production deployment remains unapproved.
- Future pipeline: lint/types/unit/integration/dependency checks and both-env
  synth -> development deploy -> API/frontend/auth/event smoke -> protected
  production approval -> same-artifact promotion, summary and rollback evidence.
  No automatic production infrastructure deployment during scaffolding.
- Remaining gates: scoped IAM/bootstrap review, DNS delegation/certificates,
  budget/notification resource configuration and actual test receipt,
  public-source/history review and legal/content approval.
  Preserve configurable WellCall references; permanent redirects require cutover
  approval. No stack/record deletions without explicit review.

## Estimated incremental AWS cost

This source-only increment adds **$0/month** until resources are deployed.
Low-traffic planning target remains **$20/app/month across both environments plus
$5 shared eventing/operations**, approximately **$65/month**, not a quote/cap.
Reuse the two existing zones (about $1/month together, plus queries; do not
double count that existing charge). Domain registration/renewals, GitHub plans,
taxes and unrelated existing spend are separate. At the previously verified
classic-bus example rate, 50,000 small events are about $0.05 ingestion; SQS,
Lambda, DynamoDB/PITR, Cognito, CDN and logs add usage-based costs.
Confirm current regional pricing before provisioning and verify budget and
operational alerts end-to-end.

The owner approved a **$65/month portfolio alerting budget**, actual-spend alerts
at 50%, 80% and 100%, and a forecast alert at 100%. The recipient was supplied
outside source control. Budget resources, verified portfolio-only cost filters
and notification delivery are not configured yet; this is not a spending cap.
Development preparation is approved; production deployment and cutover are not.

The new source-only eventing adds no current charge. Fourteen standard alarms
across both environments are approximately $1.40/month at a $0.10 planning
rate, before any free-tier allowances. Queue/event/transaction/log costs are
usage based; indefinite receipt storage grows with accepted event IDs.
Budget/recipient approval is complete; notification delivery remains unverified.
No always-on service,
NAT gateway, customer-managed KMS key or event archive is introduced.
The isolated release-preparation buckets and IAM roles add no current charge
while undeployed. Once provisioned, versioned asset storage/requests add
usage-based S3 charges; retained rollback versions need a reviewed retention
policy. No extra hosted zone, custom KMS key, ECR repository or server is added.
