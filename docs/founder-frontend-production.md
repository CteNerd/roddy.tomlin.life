# Founder frontend production promotion

This is reviewed release **source**, not a deployment or owner-access approval.
The profile root, `/assets`, `experience.html`, and retired-route HTTP 404 behavior
remain independent. No synthetic rehearsal output is eligible. Owner access stays
disabled: the candidate deliberately builds all five Founder configuration values
empty; it cannot sign in or contact the API. Enabling owner access requires separate
UAT approval and a separately reviewed release change, not environment-variable edits.

## Immutable candidate and promotion

1. Merge reviewed source to protected `main` through the usual PR process.
2. Dispatch **Prepare immutable Founder candidate** from `main`, supplying its exact
   40-character SHA. The dispatch SHA must equal that input. Existing lint, workspace
   checks, tests, build, and release-boundary checks run without AWS credentials.
3. Inspect the successful candidate run and its `founder-<SHA>` artifact. Record the
   run ID, artifact ID, and `sha256:<64 hex>` ZIP digest from its summary. The artifact
   contains only `founder-dist` and a per-file digest manifest bound to that SHA.
   Artifacts expire after 14 days; expiration requires a new candidate and review.
4. Only after the integration requirements below are separately approved, dispatch
   **Promote reviewed Founder frontend** from `main` with those exact four values.
   The workflow requires a successful same-repository/main candidate workflow run,
   an ancestor of the promoting main SHA, and the matching immutable artifact ID/digest.
   It also reads production protection metadata and fails closed unless required
   reviewers and exactly the main branch (no tag policy) are configured.
5. A reviewer approves the **production** environment deployment after inspecting
   those inputs and the verify-job summary. This never uses `aws-production`.
   After approval the metadata and downloaded ZIP digest are checked again. There
   is no rebuild, package install, or execution of downloaded JavaScript.
6. Publish only verified `founder/` files, hashed assets first and HTML last, without
   deletion. Invalidate only the three entry URLs and wait. Compare both public
   Founder entries byte-for-byte; smoke-check the profile and retired-route 404.

An inline session policy further limits every publisher session. It does **not**
establish a scoped role, environment protection, or routing approval. Candidate
and promotion workflows carry no user-provisioning or backend privileges.

## Blocking integration requirements (not performed here)

Repository evidence: `infrastructure/profile-hosting.yml` has a profile publisher
trusted to `aws-production` with root-wide object writes. That role must **not** be
reused. Read-only GitHub inspection on 2026-11-09 showed `production` has a required
owner reviewer and branch restrictions; `aws-production` has no required reviewer.
No environment settings were changed.

Before setting `FOUNDER_PRODUCTION_PUBLISHER_READY=true`, a separate infrastructure
review and authorized operator must establish and verify all of the following:

- A dedicated existing-host publisher in account `425061472162`, region `us-east-1`.
  Declarative source is `infrastructure/founder-frontend-publisher.yml`; this PR
  does not deploy it. Its only resource is the separately named role
  `rct-founder-production-frontend-publisher`; promotion rejects any other role ARN.
  Review a separate change set with the verified existing bucket and distribution
  as parameters. Confirm the existing GitHub OIDC provider, account, and no
  additional managed/inline policies on this dedicated role before readiness.
  Its OIDC trust must require audience `sts.amazonaws.com` and exact subject
  `repo:CteNerd/roddy.tomlin.life:environment:production`. Do not reuse the backend,
  community, consulting, or root profile publisher, and do not broaden their roles.
- Its base policy must match `publisherPolicy(bucket, distribution)` in
  `scripts/founder-promotion.mjs`: only `s3:PutObject` on the **existing profile bucket**
  ARN suffixed `/founder/*`, and `cloudfront:CreateInvalidation`/`GetInvalidation`
  on the **existing distribution** ARN. No list, get, delete, ACL, bucket policy,
  IAM, DNS, backend, or distribution-update permissions. The same policy is
  intersected as the workflow's session policy. CloudFront IAM scopes invalidation
  to a distribution, not individual paths; the script limits requested paths.
- Protected `production` must retain required reviewer approval and main-only
  deployment branch policy, with tags excluded. Keep the publisher-ready flag
  unset until these controls and existing-host identities are verified. No
  unprotected fallback is allowed.
- Set production environment variables `FOUNDER_PRODUCTION_BUCKET`,
  `FOUNDER_PRODUCTION_DISTRIBUTION`, and `FOUNDER_PRODUCTION_PUBLISHER_ROLE` to the
  independently verified existing host and dedicated scoped role, not guessed names.
- Review the **existing hosting stack** change set using
  `EnableFounderRoutes=true`. This opt-in, default-false source adds a CloudFront
  viewer-request function to its existing default behavior. It rewrites **only**
  `/founder` and `/founder/` to `/founder/index.html`, preserving OAuth query strings.
  Assets and all other routes remain unchanged; global 403/404 mapping stays HTTP
  404 and points to the existing profile fallback. Never add a global SPA fallback.
  Inspect live behavior associations first: an existing viewer-request function
  must be integrated, not overwritten. If this template is not the authoritative
  live stack, apply the equivalent reviewed change in that authoritative source;
  do not create a replacement bucket, distribution, certificate, or DNS record.
- Coordinate route enablement and the first publish within the approved release
  window. Routing alone cannot supply absent Founder files. Verify root/assets/
  retired URLs before and after the change. A failed post-publish probe does not
  automatically roll back; a prior successful immutable candidate can be promoted
  with fresh approval. Hashed assets are retained to support in-flight older pages.

Only declarative scoped-role source is included: no live bootstrap, AWS writes,
owner activation, DNS changes, or production environment modifications were made.
Without that integration the promotion intentionally stops before credentials are
requested.
