# Durable Founder reporting worker

Undeployed SQS consumer for the four approved v1 reporting events. It has no
business-database access, public route or financial/person-level records.
Historical mentor approvals are not an active-mentor count.

## Storage and failure semantics

The existing Founder projections table owns:

- `PK=EVENT#<domain-event-uuid>`, `SK=RECEIPT`: canonical fingerprint and approved
  source/type/fact-time/processing-time metadata. Receipts have **no TTL**:
  deleting them permits an old replay to increment again.
- `PK=MONTH#<YYYY-MM>`, `SK=<domain>#<metric>`: signed total, optimistic version,
  latest fact instant and processing time. Negative intermediate correction
  totals are valid; totals and versions must remain safe integers.

Strong reads plus one two-item conditional transaction create the receipt and
replace its projection together. Matching IDs/fingerprints acknowledge a
duplicate; changed immutable facts fail. Up to five optimistic conditional
conflicts are retried; unresolved contention, throttling, integrity failures or
unknown SDK errors return the message for SQS retry rather than inventing a
successful result. A committed transaction followed by a lost acknowledgement
is safe to redeliver. Delivery metadata and JSON key order do not change the
fingerprint. The fingerprint includes the original fact timestamp, not just
its normalized equivalent: producers must preserve original immutable facts.

Only the two configured environment queues, their matching source, the same
AWS account and `us-east-1` delivery metadata are accepted. Strict shared
schema validation occurs before storage. Partial batch responses isolate
failed records. Logs contain only SQS message ID and enumerated failure reason,
never raw payloads, tokens or SDK exception messages. Domain event IDs are
global across sources. Projection fact time is per metric/month, not a
completeness or freshness guarantee for the whole platform.

## Validation

From the repository root:

```sh
npm run check:portfolio
npm run lint
```

Unit tests include an executable CommonJS Lambda bundle with the JSON schema
and AWS SDK embedded. Mandatory hosted CI separately runs real transactions
against the digest-pinned official DynamoDB Local 3.1.0 container.

For a locally available Docker daemon, start the same image bound only to
loopback, wait for readiness, run the tests and remove that named helper:

```sh
docker run --name rct-reporting-local --rm -d -p 127.0.0.1:8000:8000 \
  amazon/dynamodb-local:3.1.0@sha256:7ef4a2c45b58c2901e70a4f28e0953a422c2c631baaaf5e2c15e0805740c7752
DYNAMODB_ENDPOINT=http://127.0.0.1:8000 npm run test:integration
docker stop rct-reporting-local
```

Tests require an explicit loopback endpoint and synthetic credentials; they
cannot silently skip or access AWS. They create/delete a unique disposable
table and exercise actual transaction conditions, concurrent updates,
duplicate/conflicting delivery, correction order and post-commit response
loss. These do not prove cloud IAM, EventBridge/SQS delivery or live recovery.

## Activation and recovery gates

See [infrastructure prerequisites](../../infra/README.md). No producer outbox
publisher or public Founder UI is wired. The separate [read API](../api/README.md)
defaults to disabled owner access and cannot mutate these records.
Governance pre-creates the Lambda-only reporting role and its dedicated boundary/
identity policy: owned projection GetItem/PutItem, two main queues and reporting
logs only. Eventing imports it immutably; no IAM roles/policies are created or
modified by application execution. Governance must precede eventing; role/trust/
boundary changes require separate bootstrap review.
No new development or production
workflow deploys this stack. Protected environments, scoped write IAM,
notification setup/receipt and real cloud smoke/recovery tests
remain mandatory. Do not copy broad local credentials into runtime or CI.

Investigate delivery DLQs separately from processing DLQs. Fix schema/source
or storage faults before an explicitly reviewed redrive. Replay original
immutable domain events; never generate new IDs for an identical contribution.
Fix business facts with a new approved correction event, not by changing a
receipt, hand-editing totals or resending changed facts under an existing ID.
No archive or automated DLQ redrive exists; retained DLQs expire after 14 days.

Rollback code to the last reviewed worker revision through a revert PR and
reviewed change set. Preserve table, receipts, queues and boundary. If the
table needs restoration, pause both event-source mappings, restore receipts
and projections from the **same PITR point**, review destination/IAM changes,
and replay every approved original event missing after that point before
re-enabling consumption. Source outboxes/replay inventory and a real restore
rehearsal are not implemented; do not activate production on this runbook alone.
