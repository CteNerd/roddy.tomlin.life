# Portfolio implementation status

Updated: 2026-11-05, merged application/governance foundations and offline reporting.
Scope: three existing private repos, all defaulting to `main`. Work remains on
`feat/durable-reporting`; no application, DNS or infrastructure deployment
was performed by this increment.

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
  `6b91a720c76c7e439a9fdfb61b2dc42bee613081`.
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
  Producer copies remain pinned until the authority revision is reviewed.
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
hosting. Its API still has no database grants or metrics route. Separate offline
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

Proposed new environment names: **`development`** and **`production`**; earlier
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

Required roles: six app OIDC deploy roles (3 repos x 2 environments), separate
bus deploy authority per environment, constrained CloudFormation execution/
bootstrap roles, narrow static publishers, per-handler runtime roles, source
outbox publishers and Founder consumer/read-only API roles. Existing profile
publisher stays narrowly scoped. Review the complete assume-role/pass-role chain;
no broad local bootstrap identity is copied to CI or app profiles.

## Validation and release blockers

- **Passing locally:** Consulting 16 tests, Community 15, Personal/Founder 58
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
- **Blockers:** private branch protection previously returned entitlement HTTP
  403. Current environment inventory still has only `copilot` on each producer;
  personal `aws-production`/`github-pages` have branch policies but no reviewer
  approval. New required production approval has not been configured or
  verified. New production delivery remains blocked until protected approval
  works; manual dispatch alone is not an equivalent substitute.
- Future pipeline: lint/types/unit/integration/dependency checks and both-env
  synth -> development deploy -> API/frontend/auth/event smoke -> protected
  production approval -> same-artifact promotion, summary and rollback evidence.
  No automatic production infrastructure deployment during scaffolding.
- Remaining gates: scoped IAM/bootstrap review, DNS delegation/certificates,
  budget recipient confirmation and actual test receipt, legal/content approval.
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

The new source-only eventing adds no current charge. Fourteen standard alarms
across both environments are approximately $1.40/month at a $0.10 planning
rate, before any free-tier allowances. Queue/event/transaction/log costs are
usage based; indefinite receipt storage grows with accepted event IDs.
Notification recipients and budgets remain unapproved. No always-on service,
NAT gateway, customer-managed KMS key or event archive is introduced.
