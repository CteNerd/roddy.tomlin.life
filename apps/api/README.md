# Founder read-only API

Source-only backend; no deployment or public Founder UI is activated.
`GET /health` stays public and `GET /me` returns only the caller's own identity.
`GET /metrics?month=YYYY-MM` is Gateway-JWT protected and also authorizes the
exact owner inside the backend. There are no metrics mutations.

## Explicit owner gate

The foundation stack's `FounderOwnerSubject` parameter defaults to `disabled`.
Keep it disabled until the sole owner has been deliberately invited into that
environment's MFA-required Cognito pool and its actual UUID `sub` is verified.
A reviewed change set must set that exact subject separately per environment.
It is not an email, username, group claim or frontend setting. Do not put an
actual owner identity in source fixtures, frontend code, issues or logs.
CDK populates `FOUNDER_OWNER_SUBJECT` and `REPORTING_TABLE_NAME`; no access keys
or new GitHub secret are required.

The API trusts only API Gateway's validated claims, never a request header it
parses itself. Metrics additionally require `token_use=access` and the exact
configured subject. Missing authentication returns 401; other subjects, ID
tokens and disabled owner access return 403 before any database operation.
The JWT issuer/audience remains the environment's own Cognito pool/client.
No users or invitations are created by this increment. A subject match in a
unit test is not proof of actual Cognito/MFA/token issuance.

## Query and response boundaries

Require exactly one explicit `month`, with the contract's four-digit year and
month 01-12. Reject repeated or unknown query parameters rather than selecting
an arbitrary value. No implicit current-month/timezone default is introduced.

The only data grant is DynamoDB Query on the owned projections table, with
LeadingKeys restricted to monthly partitions. No Scan, GetItem, receipt reads,
business tables, writes or event publishing is permitted. The role also uses
the governance runtime boundary; governance must exist before foundation.

Query one month consistently with a small limit. Reject pagination, unknown
metrics, corrupt/unsafe counters, malformed timestamps, duplicate records and
unexpected fields instead of returning partial or misleading totals.
The worker and API share the stored-record decoder.

Successful responses contain `month` and `metrics`, each with `domain`,
`metric`, signed `total`, `latestOccurredAt` and `processedAt`. Only inbound
leads and historical mentor approvals exist; they are not qualified leads or
active mentor counts. No PK/SK, receipt, version, private fields or event IDs
are serialized. An empty month returns `metrics: []`, **not fabricated zeros**.
Fact and processing timestamps do not prove source completeness or freshness.
Responses use `Cache-Control: no-store`; there is no CDN/frontend data cache.

Storage/integrity errors return an explicit generic 503, with only request ID
and enumerated reason in logs, not raw records or SDK messages.

## Validation and release gates

`npm run check:portfolio` and `npm run lint` cover authorization negatives,
strict query/response behavior and worker compatibility. Hosted mandatory
DynamoDB Local integration exercises the actual read adapter against committed
worker projections and genuinely empty months. Template tests assert JWT
binding, disabled default and Query-only monthly IAM.

Both environment synths, the public profile's 22 tests and ten-file release
boundary remain required. Live Cognito allow/deny/MFA, IAM LeadingKeys denial,
cloud event delivery and recovery are still untested. Protected environments,
scoped write/deploy roles, notifications and release approval remain blocked;
do not treat this read API as production readiness or expose private legacy
pages through the unchanged profile host.

Rollback code through a reviewed revert/change set without deleting the table
or receipts. Setting the owner gate back to `disabled` revokes application
metrics authorization on the deployed revision; review token/session recovery
and verify the actual 403 before treating that as a live revocation rehearsal.
