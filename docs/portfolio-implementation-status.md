# Portfolio implementation status

Updated: 2026-11-05, following the final domain/deployment decisions.
Scope: three existing private repos, all defaulting to `main`. Work remains on
`feat/portfolio-foundation`; no application, DNS or infrastructure deployment
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

## Confirmed domains and outstanding DNS/certificates

| App | Production web | Development web | Production API |
| --- | --- | --- | --- |
| Consulting | `thirddowntech.com` | `dev.thirddowntech.com` | `api.thirddowntech.com` |
| Community | `cutblock.org` | `dev.cutblock.org` | `api.cutblock.org` |

Read-only AWS checks confirm both registrations have auto-renew enabled and
both public hosted zones exist. Each zone currently contains NS/SOA records
only; no matching ACM certificate was returned in `us-east-1`.

Reuse those zones; validate public delegation before deployment. Provision
DNS-validated ACM certificates in `us-east-1` for the CloudFront web names and
regional API custom names. Add only reviewed certificate-validation and explicit
app/API alias records. Never replace zone delegation or unrelated records.
Use generated API Gateway URLs for development initially; no development API
custom hostname has been approved. The personal site's existing domain and
hosting remain unchanged; its development hostname is still to be selected.
Registration does not establish legal brand clearance or authorize public cutover.

## Planned infrastructure, not yet deployed

Per app/environment: CDK v2 stacks for private S3/CloudFront OAC hosting,
HTTP API/Lambda, Cognito, owned DynamoDB on-demand tables, private documents,
logs/alarms and runtime IAM. Development and production never share tables/auth.
The personal repo additionally owns isolated bus, SQS/DLQs and reporting stacks;
Founder API is read-only and its worker writes only its own projections.
No unnecessary VPC, NAT, always-on server or RDS. Preserve the existing profile
CloudFormation stack and all existing applications until replacements pass.

Community's roadmap includes technology, AI, mentorship, athletic training,
fitness and future facilities; only the approved adult tech/mentorship pilot
is initially enabled. Youth enrollment requires reviewed safety/guardian consent.
Assignment-level permissions are enforced in backend APIs; no contributor or
mentor gets finance, contracts or unrelated records.

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

Required roles: six app OIDC deploy roles (3 repos x 2 environments), separate
bus deploy authority per environment, constrained CloudFormation execution/
bootstrap roles, narrow static publishers, per-handler runtime roles, source
outbox publishers and Founder consumer/read-only API roles. Existing profile
publisher stays narrowly scoped. Review the complete assume-role/pass-role chain;
no broad local bootstrap identity is copied to CI or app profiles.

## Validation and release blockers

- **Passing locally:** 6 contract tests per repo; 5 additional reference-reducer
  tests in the personal repo; strict workspace type checks; both producer pin
  checks; personal lint, 22 existing tests, build and 10-file public-release check.
  Ignore tests confirm caches, dependency trees, env files and output are excluded.
- Hosted validation must pass on each PR's latest head before merge; an older
  successful run does not substitute for validation of the current revision.
- **Not implemented/tested:** new frontend/API integration, backend assignment
  authorization, CDK synth, deployment smoke, durable outboxes/consumer, Cognito,
  live event recovery, notification receipt or rollback/restore rehearsal.
  Contract CI does not certify the old CRA application or dependency health.
- **Blockers:** private branch protection previously returned entitlement HTTP
  403; required production environment approval has not been configured or
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

Low-traffic planning target remains **$20/app/month across both environments plus
$5 shared eventing/operations**, approximately **$65/month**, not a quote/cap.
Reuse the two existing zones (about $1/month together, plus queries; do not
double count that existing charge). Domain registration/renewals, GitHub plans,
taxes and unrelated existing spend are separate. At the previously verified
classic-bus example rate, 50,000 small events are about $0.05 ingestion; SQS,
Lambda, DynamoDB/PITR, Cognito, CDN and logs add usage-based costs.
Confirm current regional pricing before provisioning and verify budget and
operational alerts end-to-end.
