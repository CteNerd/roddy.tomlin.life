# ADR 0001: Portfolio integration in the three existing repositories

Status: Accepted for local foundation implementation, 2026-11-05.

## Context

The November portfolio plans proposed a fourth repository for Founder reporting.
The owner instead selected this existing personal repository, alongside
`CteNerd/consulting.wellcall.biz` and `CteNerd/community.wellcall.biz`.

## Decision

- Preserve the approved public profile, Experience page, output allowlist, and
  true 404 responses for retired personal routes.
- Add an authenticated `/founder` path in a later increment. Cognito with owner
  MFA comes first; Google federation is a separate subsequent change.
- Founder APIs only read their reporting projections. A separately authorized
  worker writes those projections; neither reads or writes source-domain data.
- This repository owns authoritative event schemas in `packages/contracts`,
  fixtures, metric semantics, and a separately deployed portfolio bus stack.
- Producers pin reviewed contract files and their hashes to an immutable commit.
  Producer business semantics remain owned by the producer.
- One existing AWS account in `us-east-1`, with distinct development/production
  tables, auth, queues, stacks and roles. No shared database across environments.
- Use private S3, CloudFront OAC, API Gateway HTTP APIs, Lambda, DynamoDB
  on-demand, EventBridge and SQS. Do not copy Aurora/NAT fixed-cost patterns.
- Preserve the existing profile CloudFormation stack. New CDK stacks must not
  redeclare its resources without an explicit resource migration.
- Contracts retain `rct.consulting` and `rct.dotcom` technical source IDs. Display
  branding is configurable and provisional; it does not rename infrastructure.
- No personal stories, paywall, AI, MCP, minors, athletics or payments processing
  are added by this foundation.

## Release and repository boundaries

Feature branches and reviewed PRs are the normal workflow. The personal default
remains `main`; the owner approved migrating both WellCall defaults to `main` and
making them private after checking workflow/hosting dependencies.

PR CI has no AWS credentials or OIDC authority. Future default-branch merges
deploy development; production promotes an immutable tested candidate only after
protected GitHub environment approval. If that protection is unavailable,
production is blocked; manual dispatch alone does not satisfy this requirement.
Until that pipeline is implemented and approved, existing publication stays
manual. The public publisher must not gain bus or reporting administration.

The owner is initially the sole maintainer: require PRs and passing checks where
GitHub entitlement permits, not an impossible second-person review. Verify
private-repository protection availability; subscription names are not evidence
that a protection rule exists.

Broad local bootstrap access is not a pattern to copy. App/environment deploy,
CloudFormation execution, local development and runtime roles are individually
scoped; review the entire CDK role chain and pass-role boundaries before AWS
changes. Budget/operational notification setup is accepted only when the owner
receives an end-to-end test.

## Consequences

The three repositories remain independently deployable. Reporting outages do
not block business transactions: producers own transactional outboxes and
recovery; consumers own deduplication and reconciliation. The shared bus and
dashboard cannot be accidentally deployed as part of public-profile publishing.
This ADR authorizes code foundations, not AWS provisioning or DNS changes.

## Confirmed domain/deployment amendment

Consulting uses `thirddowntech.com`, `dev.thirddowntech.com` and
`api.thirddowntech.com`; Community uses `cutblock.org`, `dev.cutblock.org` and
`api.cutblock.org`. Both domains are registered in Route 53 with auto-renew.
Reuse existing zones, use ACM in `us-east-1` for CloudFront, and preserve
unrelated records/stacks. Brand names remain subject to legal clearance.
New environment names are `development`/`production`; do not rename existing
live profile resources or its manual publishing environment.

The [implementation status report](../portfolio-implementation-status.md)
records verified DNS state, required variables/roles, tests, costs and blockers.
