# Founder reporting reference model

`projectEvent` is a pure, typed reducer for the initial contract metrics. It
validates inputs, tracks immutable domain event IDs and content fingerprints,
separates domain/month/metric totals, and handles duplicate/reordered delivery
and late signed corrections without mutating the prior state.

This is not a deployed consumer or persistent idempotency store. Its in-memory
maps are a reference for later DynamoDB transaction and SQS integration tests.
`latestOccurredAt` is the latest fact timestamp, not processing time, health,
or a guarantee that all prior events have arrived.

Run both foundation workspaces from the repository root:

```sh
npm ci --no-audit --no-fund
npm run check:portfolio
```
