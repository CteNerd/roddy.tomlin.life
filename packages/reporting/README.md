# Founder reporting reference model

`projectEvent` is a pure, typed reducer for the initial contract metrics. It
validates inputs, tracks immutable domain event IDs and content fingerprints,
separates domain/month/metric totals, and handles duplicate/reordered delivery
and late signed corrections without mutating the prior state.

This is not a deployed consumer or persistent idempotency store. Its in-memory
maps are the reference for the [durable reporting worker](../../apps/reporting-worker/README.md).
`prepareReportingEvent` shares strict parsing, canonical fingerprinting and
metric contributions with that worker, including numeric instant ordering for
valid offsets that normalize beyond four-digit years.
`latestOccurredAt` is the latest fact timestamp, not processing time, health,
or a guarantee that all prior events have arrived.

Run foundation workspaces from the repository root:

```sh
npm ci --no-audit --no-fund
npm run check:portfolio
```
