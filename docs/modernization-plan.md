# Portfolio and personal-story platform: modernization plan

Date: October 22, 2026

Status: long-term proposal with an implemented static profile; AWS publication approved November 3, 2026. See the latest release milestone below.

Baseline: repository commit `4a6a26e`

### November 3, 2026: dinner-ready release

An expedited, deliberately limited public profile is now implemented with React/Vite, prerendered HTML, consistent responsive styling, behavior/accessibility tests, and a manual-only GitHub Pages workflow. This is a bridge to the architecture below, not completion of the monorepo or paywall. Section 2 remains the historical October 22 baseline, not a description of the current dependency graph.

- The owner confirmed the public title **Director of Software Engineering**, naming FMG, high-level leadership themes, and contact details (including a corrected phone number and a request to leave voicemail). This resolves the title uncertainty for the interim profile; promotion dates and detailed outcomes remain unverified for publication.
- The career export remains an unapproved working dossier. Its internal sources, names, details, and metrics have not been copied into public content or this repository.
- [Matthew Nalty's site](https://matthewnalty.com) is the supplied design reference. The interim design uses broad editorial principles (readable type hierarchy, whitespace, clear sections, restrained colors) with original wording, layout details, and assets; it does not copy the site's text, code, or photography.
- Personal story/hobby components and photos remain private source, excluded from the build. Only approved entry modules and `site-public/` assets ship in `dist/`. Historical deployments/caches need separate inspection.
- Two professional portraits supplied by the owner on November 3 are included as optimized, metadata-stripped public web copies: a headshot in the opening profile card and a seated portrait in About. Historical family/personal media remains excluded.
- GitHub reports the repository is already private. The owner reports GitHub Pro, allowing private-repository Pages hosting while keeping the website public. Pages is not configured yet and the custom domain did not resolve from the development environment.
- The owner authorized local build/test and deployment preparation, **not publishing**. No commits, pushes, Pages activation, or DNS/AWS changes are authorized by this milestone.
- The former CRA graph has been replaced locally with React 19/Vite 8 and a fresh lockfile. Refresh dependency-path/advisory assessment before claiming the historical 237 Dependabot alerts are resolved.

See the [README](../README.md) for verified commands, build boundaries, and manual release steps. Full-stack, resume/PDF, paywall, and agent/MCP phases remain future work.

The owner subsequently supplied 2025/2026 resumes and approved public employers, historical roles/dates, education, and qualitative contributions. The profile now includes a readable experience timeline from 2014 onward, with FMG's director promotion confirmed as February 2026 and separate Integrate employment periods. Disputed metrics and sensitive operational/personnel details remain excluded. Supplied documents are not copied into the repo or release; a corrected downloadable PDF is deferred until the owner reviews the timeline. Print/save includes the timeline.

The owner also approved introducing his NFL background with the Jacksonville Jaguars and Atlanta Falcons. That concise hook is now part of the homepage without importing memoir text or inventing football dates/statistics. The full engineering timeline and education have moved to a separate, prerendered `experience.html` page to reduce mobile homepage scrolling. Both pages have working static navigation and independent print/save behavior; the Experience page is the printable career view.

The Experience page introduction is intentionally minimal: back link, "Experience" heading, and one sentence connecting the NFL to engineering leadership, followed immediately by the FMG timeline. Detailed NFL introductory copy stays on the homepage rather than competing with the career chronology.

### November 3, 2026: private-source AWS release

The earlier local-only authorization above is historical. The owner subsequently approved committing/pushing the profile and then AWS provisioning, public deployment, and connecting `roddy.tomlin.life`.

- The repository was briefly public to enable Pages. A read-only review confirmed that legacy narratives, media, and a Google API key were accessible in source/history even though excluded from the build. The owner authorized restoring private visibility; unauthenticated source access now returns 404. Privacy restoration cannot retract downloaded copies.
- The default branch is now `main`; checks, manual workflows, and deployment environment policies must use it.
- AWS Route 53 hosts `tomlin.life`. Public nameservers match the authorized hosted zone. The profile hostname had no explicit record and inherited a wildcard pointing to an ACM validation target, not a website. The approved stack adds explicit profile A/AAAA aliases and certificate validation without modifying the wildcard.
- The selected host is private encrypted S3 behind CloudFront with HTTPS and origin access control. [Infrastructure](../infrastructure/profile-hosting.yml) and a [manual GitHub OIDC deployment workflow](../.github/workflows/aws.yml) keep public output separate from private source. Only checked `dist/` content is published; deployment credentials cannot modify infrastructure or read the original repository through AWS.
- Default Actions permissions are read-only, Actions PR approvals are disabled, and dependency security updates are enabled. GitHub rejected private-repository branch protection and secret scanning under the current effective entitlement. These remain unresolved plan limitations, not enabled safeguards.
- Google key revocation remains pending: the owner needs to identify the Google Cloud project. No credential validity or abuse was tested. AWS credentials cannot revoke a Google key, and deleting source alone would not resolve exposure.

Release verification:

- The AWS stack completed successfully and [the custom domain](https://roddy.tomlin.life) serves the approved profile over HTTPS. HTTP redirects to HTTPS, direct S3 object access returns 403, and retired story routes return the safe profile with HTTP 404.
- [Main checks](https://github.com/CteNerd/roddy.tomlin.life/actions/runs/41683115781) and the [manual AWS OIDC release](https://github.com/CteNerd/roddy.tomlin.life/actions/runs/41683814801) passed. Browser checks at 320px and 1440px confirmed both pages load, portraits load, no horizontal overflow, no script errors, and no failed requests.
- Dependabot now reports one open moderate advisory for development-only `minimatch` through ESLint: [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). The installed version is 10.2.6; the advisory requires 11.0.1 or later. A forced major override or incompatible ESLint downgrade was not applied. The production artifact does not ship ESLint; compatible remediation remains pending.

The [README](../README.md) contains reproducible provisioning/release steps. This static AWS milestone does not implement a backend, member authentication, paywall, agent, or MCP.

## 1. Purpose and decisions already made

Rebuild this site as a full-stack monorepo that presents a credible Director of Software Engineering portfolio without losing the history behind it.

The product has three connected, deliberately separate experiences:

1. **Public professional presence:** resume, leadership approach, career progression, approved project case studies, and an agent that answers professional questions.
2. **Personal story library:** preserve the memoir, continue writing, and selectively publish stories to members without making everything public.
3. **Knowledge and integration layer:** approved context about other applications, member-authorized story Q&A, and an owner-only MCP interface initially.

Planning preferences confirmed during discovery:

- AWS-first hosting for the whole application.
- Compare subscriptions, one-time access, and invited readers before selecting a payment model.
- Include both a public professional agent and member story Q&A.
- Keep MCP owner-only initially.
- Deliver a professional, consistent visual system across public, member, and owner screens.
- Support personal-laptop development in VS Code, phone/tablet issue and PR review, and a browser-based development environment.

These are product directions, not authorization to deploy infrastructure, expose existing content, connect client repositories, or activate billing.

### What success looks like

- A hiring leader can understand professional scope, leadership style, and demonstrated impact without signing in.
- Readers can follow the unusual career path through an approved public narrative, while more personal writing stays behind explicit access controls.
- The owner can publish a new story or update a case study without editing React components.
- The agent answers from approved, current evidence, cites its sources, and declines questions outside that evidence.
- Other applications stay independent; this site holds approved descriptions and optionally approved snapshots, not unrestricted access to their internals.
- The repo is reproducible, tested, monitored, and maintained rather than dependent on an aging local setup.

## 2. Existing application: evidence and gaps

### Architecture and repository health

| Area | Observed evidence | Consequence |
| --- | --- | --- |
| Application | A single JavaScript Create React App frontend; React/React DOM locked at 17.0.1 and `react-scripts` at 4.0.1 in [package.json](../package.json) and [package-lock.json](../package-lock.json). | This is a frontend migration plus new backend work, not a backend refactor. |
| Routing | [Main.js](../src/app/Main.js) defines 16 routes, including the `/` fallback. | Inventory and map every route before cutover; currently unknown paths fall through to Home rather than a dedicated 404. |
| Navigation | [sideNav.js](../src/app/side-nav/sideNav.js) mixes biography, hobbies, social links, and four external project links. | The professional identity needs a new information hierarchy. External links are leads for discovery, not verified current case studies. |
| Content | Memoir text is embedded in [the about components](../src/app/about/); images live in the frontend source/public trees. | Hiding a link or adding a login screen would not secure text still shipped in the JavaScript bundle. |
| API usage | [vlog.js](../src/app/vlog/vlog.js), [workouts.js](../src/app/workouts/workouts.js), and [workouts-instructional.js](../src/app/workouts/workouts-instructional.js) call YouTube from the browser through [client.js](../src/httpClient/client.js). | Move retained integrations behind a controlled backend or replace them with curated embeds. |
| Integration configuration | A YouTube API key is embedded in the source of those three screens. | Verify ownership and restrictions, rotate/restrict it, inspect usage, and stop embedding it in new clients. Do not copy its value into planning docs or issues. |
| Loading behavior | The YouTube screens repeat asynchronous effect/request/table logic without explicit request-failure UI. | Consolidate the retained behavior and add loading, empty, error, timeout, and cancellation handling. |
| Hosting | [footer.js](../src/app/footer/footer.js) says AWS Amplify. No checked-in Amplify configuration or infrastructure definition was found. | Existing AWS resources, account, region, DNS, and deployment configuration remain unverified. |
| Backend capabilities | No checked-in backend, database schema, authentication, payments, agent, MCP server, or infrastructure code was found. | These are new capabilities with separate delivery and operating costs. |
| Resume | [footer.js](../src/app/footer/footer.js) points to an external resume URL whose filename references 2020. | Verify the document; replace the dependency on that link with an owner-approved, versioned resume. |
| Tests | The baseline [App.test.js](https://github.com/CteNerd/roddy.tomlin.life/blob/4a6a26e/src/App.test.js) asserts a "learn react" link that the baseline [App.js](https://github.com/CteNerd/roddy.tomlin.life/blob/4a6a26e/src/App.js) does not render. | The baseline test is stale, not evidence of a working regression suite. |
| Automation | GitHub reports zero Actions workflows; no checked-in CI or Dependabot configuration was found. | Establish quality gates and automated maintenance before expanding the system. |
| Branding/SEO | [manifest.json](../public/manifest.json) retains CRA sample names; [index.html](../public/index.html) has shared metadata and an advertising script. | Replace starter metadata, add page-specific SEO, and explicitly decide whether advertising belongs on the new site. |
| Accessibility | Baseline navigation uses clickable non-button elements and direct DOM style changes in [App.js](https://github.com/CteNerd/roddy.tomlin.life/blob/4a6a26e/src/App.js) and [sideNav.js](../src/app/side-nav/sideNav.js). | Rebuild keyboard/focus behavior, semantics, contrast, typography, and responsive navigation. |
| Incomplete pages | [wedding.js](../src/app/about/wedding.js) is unfinished; [football pages](../src/app/football/) contain placeholder text. | Do not automatically republish unfinished pages or count them as completed content. |
| Repository hygiene | The package name is unrelated to the site's identity; `.eslintcache` is tracked; no runtime pin was found. | Rename during the workspace migration, remove generated cache from tracking, and pin a supported runtime/toolchain. |

The repository is private according to GitHub. That does **not** establish that the deployed website or its historical bundles are private.

### Dependency snapshot

Read-only GitHub Dependabot API inspection returned:

| Severity | Open alerts |
| --- | ---: |
| Critical | 20 |
| High | 114 |
| Medium | 83 |
| Low | 20 |
| **Total** | **237** |

- These alerts cover **84 distinct package names**, not 237 independently verified vulnerabilities in application behavior.
- Axios accounts for 25 alerts and Moment for 2. Many other findings involve build/dev-server/transitive packages.
- No open Dependabot-authored PRs were returned at inspection time. Alerts do not imply remediation PRs are configured.
- The lockfile uses format version 1.
- No exploitability assessment or dependency-path audit was performed. Dependabot's `runtime` scope alone does not establish production reachability for a CRA build.

| Dependency | Locked version | Proposed action |
| --- | --- | --- |
| React / React DOM | 17.0.1 | Migrate together to versions supported by the selected frontend framework and host. |
| `react-scripts` | 4.0.1 | Retire CRA rather than making it the long-term platform. React deprecated CRA for new applications in 2025. |
| `react-router-dom` | 5.2.0 | Replace with framework routing if Next.js is selected; preserve a deliberate URL map. |
| Axios | 0.21.0 | Prefer native `fetch` for the small retained integration surface; otherwise select a supported, patched release after path/behavior review. |
| Moment | 2.29.1 | Replace the visible video-date formatting use with `Intl.DateTimeFormat`, preserving timezone and displayed-date semantics. |
| Ant Design | 4.9.3 | No direct `antd` component imports were found; confirm before removal. |
| `@ant-design/icons` | 4.3.0, transitive | Imported directly by source but not directly declared. Declare it if retained, or replace intentionally; do not depend on hoisting. |
| ESLint / Prettier | 7.15.0 / 2.2.1 | Adopt framework-compatible maintained tooling; put formatting/test tooling in development dependencies. |
| Testing Library | React 11.2.2; user-event 12.5.0; jest-dom 5.11.6 | Upgrade with React and replace stale starter tests with behavior tests. |
| `web-vitals` | 0.2.4 | Replace or update alongside an actual performance measurement plan. |

Public npm metadata at discovery reported React 19.3.1 and Next.js 16.4.2. These are observations, **not pinned migration targets**. Choose supported, patched versions at implementation time, including their hosting and runtime constraints.

### Limits of this discovery

Source/configuration, lockfile metadata, GitHub repository metadata, Actions metadata, Dependabot alerts, and open Dependabot PRs were inspected. No dependencies were installed, app tests/builds executed, or live deployment examined. No AWS account, billing account, external project repository, or client system was accessed. The test mismatch above is a source-level finding, not a captured test run. GitHub Pages metadata returned 404; that does not identify the actual host.

## 3. Product boundaries and information architecture

### Public professional experience

Proposed routes:

- `/`: leadership positioning, concise narrative, selected outcomes, featured work, resume and contact calls to action.
- `/resume`: accessible HTML resume and downloadable, versioned PDF.
- `/experience`: approved career timeline and transition story.
- `/leadership`: decision-making, team development, delivery, architecture, and operating principles supported by examples.
- `/projects` and `/projects/:slug`: approved case studies and application summaries.
- `/ask`: public professional agent.
- `/stories`: only separately approved public titles, teasers, and membership information.
- `/contact`: deliberately selected professional contact mechanism.

The professional material stays available without account creation, payment, or use of the agent. Do not force a recruiter to chat to get basic facts.

### Authenticated experiences

- Member: account/access status, authorized story library, story reader, story Q&A, and payment management if enabled.
- Owner: content drafts, preview, revision history, classification, publication controls, project approvals, invitations/entitlements, and source freshness review.
- Owner MFA is required. Authentication identifies a user; backend authorization decides what that user can read or change.

Keep hobbies available only where intentionally retained. They can support the broader identity without dominating the professional landing page.

### Content classification

| Classification | Typical use | Agent access | Distribution |
| --- | --- | --- | --- |
| `public` | Resume, approved leadership narrative, approved project summary | Public and member professional Q&A | Public pages and explicitly public assets |
| `member` | Published stories approved for an entitled audience | Only authorized member story Q&A, and only if separately AI-approved | Authenticated backend after entitlement checks |
| `owner` | Unpublished writing, notes, unapproved source material | Excluded by default; no initial owner-private retrieval feature | Owner-only editing and storage |

Store publication state separately from audience: `draft`, `review`, `published`, `archived`. A paid account must not gain access to drafts or all stories automatically. Per-story grants or collection grants decide the actual accessible set. Public teasers are separately approved fields, not automatically generated excerpts.

**Payment is not privacy.** Readers can copy what they can access. Particularly sensitive material should remain owner-only or offline. Review third-party names, photographs, permissions, and consent before publication.

## 4. Recommended technical architecture

### Start with a modular application, not microservices

Use **TypeScript, npm workspaces, a Next.js frontend, a modular Node.js backend, and AWS CDK infrastructure**. Keep domain rules in shared backend packages and deploy small serverless entry points where useful. Separate frontend/backend responsibilities without creating a distributed service for every feature.

Use npm workspaces initially because the repo already uses npm and Amplify documents workspace support. Add Turborepo/Nx only when actual build/test scale justifies another tool.

```text
apps/
  web/                  Next.js public, member, and owner experiences
  api/                  HTTP handlers, webhooks, agent job handlers
  mcp/                  Owner-only stdio MCP adapter initially
packages/
  contracts/            Request/response schemas and generated API types
  domain/               Content, access, projects, entitlement rules
  data/                 DynamoDB and S3 adapters
  agent/                Retrieval, source policy, prompts, evaluations
infra/                  AWS CDK stacks and environment configuration
docs/                   Architecture decisions and operating documentation
```

- Web and MCP consume the same backend capabilities. MCP must not bypass API authorization by reading tables directly.
- Share runtime validation schemas as well as TypeScript types; never trust browser inputs, webhook JSON, or model tool arguments.
- Keep Node/AWS modules out of browser dependency graphs. Never put protected content into frontend packages.
- Keep other clients' apps in their own repositories unless a separate migration is explicitly desired.
- Do not add a shared UI package until there is a real second UI consumer.

### AWS service proposal

| Concern | Initial recommendation | Rationale / condition |
| --- | --- | --- |
| Web hosting | Amplify Hosting, subject to a compatibility proof of concept | AWS-first, managed builds, workspace support, public prerendering and authenticated rendering. Existing hosting must be verified, not assumed reusable. |
| Backend | API Gateway HTTP API + Lambda | Independent, validated backend for content, access, project summaries, billing, and agent job control. |
| Agent execution | SQS + Lambda worker with dead-letter queue | API creates a bounded run and returns its identifier; web polls authorized run status/results. Avoid making initial correctness depend on streaming or long HTTP requests. |
| Identity | Cognito user pool with secure server-managed web sessions | Managed identity and owner MFA. Validate token issuer/audience/expiry; do not use user-editable attributes as owner authority. |
| Structured state | DynamoDB on-demand | Suitable for a small known set of content, entitlement, project, and job access patterns without an always-on database. |
| Documents/media | Separate public-media and protected-content S3 buckets | Public assets can be cached; protected bodies and member media have a distinct policy boundary. |
| Model inference | Amazon Bedrock, exact model chosen after evaluation | AWS-first provider integration. Region, model access, inference routing, data handling, latency, and cost require confirmation. |
| Configuration/secrets | SSM Parameter Store for non-secret config; Secrets Manager for credentials | Do not put secrets into source, browser bundles, or public build variables. |
| Operations | CloudWatch, CloudTrail, AWS Budgets, alarms | Visibility into failures, privileged changes, usage, and spend. |
| Provisioning/deploys | CDK and GitHub Actions with AWS OIDC | Version infrastructure; avoid long-lived deployment keys. |
| Billing if selected | Stripe-hosted Checkout and customer portal | Avoid handling card data; Stripe is an explicit external service despite AWS-first application hosting. |
| MCP | Local stdio adapter calling the protected API | Keeps the initial owner interface off the public network. Remote hosting is a later decision. |

SQS jobs must tolerate duplicate delivery, persist failure states, bound retries, and expire abandoned runs. Return queued status only after durable enqueue succeeds; compensate/mark failure if persistence and enqueue cannot both complete. Set worker concurrency and model/token limits to bound spend.

### Frontend hosting compatibility gate

The AWS documentation inspected lists Next.js support through version 15 and explicitly excludes Next.js streaming and on-demand ISR; npm reports a newer framework major. Do not assume "latest Next.js on Amplify" works.

Before selecting exact versions, deploy a small workspace proof of concept covering:

1. A prerendered public page, dynamic authenticated page, secure cookie handling, image delivery, and deep-link refresh.
2. Shared workspace package builds, supported Node runtime, deployment permissions, and production build output.
3. Public-content refresh after publication and cache invalidation without unsupported on-demand ISR.
4. Protected-page responses that cannot be shared between identities through CDN or framework caches.

Choose a patched, still-supported framework version that Amplify supports **only if** its support window is acceptable. If no acceptable overlap exists, host the web container on ECS Fargate behind an ALB; price its fixed baseline and networking before approval. Do not downgrade onto an unsupported framework or introduce an unverified adapter just to retain Amplify.

Initial agent UX uses a run-status/polling contract, not token streaming. Streaming can be added later with a separately tested transport/runtime without changing authorization rules.

### Primary request flows

```text
Public visitor -> public web pages -> approved public content
Member -> secure web session -> API -> publication + entitlement check
                                      -> protected document/media
Owner -> owner UI -> API -> revision/classification/publication workflow
Chat -> API -> authorized run -> SQS -> worker -> scoped retrieval -> Bedrock
                                                        -> checked/cited result
Client -> authorized status polling -> same-scope result
Owner MCP client -> local MCP adapter -> authenticated API -> shared domain rules
Stripe -> signed webhook -> durable idempotent event processing -> entitlement
```

The web session layer handles cookies and forwards only properly scoped credentials to the API. Use HttpOnly/Secure/SameSite cookies, CSRF/origin protection for mutations, explicit CORS configuration, and no public caching of session-dependent responses.

## 5. Data, storage, and content lifecycle

A data store becomes necessary when stories, invitations, entitlements, jobs, and editable project knowledge arrive. The first public portfolio milestone can still use reviewed public structured content; do not provision unused stateful services before their phase.

### Logical records and access patterns

| Record | Required information | Main access patterns |
| --- | --- | --- |
| Professional profile / experience | Approved role narrative, dates, achievements, source/review date, revision | Public profile; owner edit/review |
| Project | Stable ID/slug, approved summary, role, architecture overview, approved outcomes, permissions, source freshness | List published summaries; get by slug; owner review queue |
| Story metadata / revision | ID/slug, classification, state, explicit teaser, collection, body object/version reference, AI approval | Public teasers; authorized library; get permitted revision |
| Entitlement | User subject, resource/collection, grant source, status, start/end, revocation/version | Check one user's access; list authorized resources; revoke |
| Billing event | Provider event ID, processing state, provider references, audit timestamps | Deduplicate/reconcile events; investigate access changes |
| Agent run | Principal/scope, requested corpus, source versions, job/result state, expiration | Get only own permitted run; cleanup; inspect redacted failures |
| Publication audit | Actor, resource/revision, action, timestamp | Investigate publish/access changes without copying story bodies into logs |

Design DynamoDB keys/indexes against these queries before implementation; separate content, access/billing, and expiring agent-job concerns as needed. Avoid unrestricted scans and accidental reliance on eventual consistency for revocation. Use conditional writes/transactions for revisions, grants, and duplicate events.

If relational reporting, complex joins, or a substantially different access pattern becomes necessary, reassess managed PostgreSQL with a written cost/operations comparison. Do not add both DynamoDB and PostgreSQL initially.

### S3 and publication rules

- **Public-media bucket:** approved resume PDFs and public images, with S3 Block Public Access enabled and delivery through controlled CloudFront origin access.
- **Protected-content bucket:** story bodies, revisions, and member media; block public access, encrypt, and keep access behind backend checks.
- Public/protected bucket policies and roles must be separate. Do not use a single public prefix as the only boundary.
- Use short-lived signed delivery only after entitlement checks when appropriate. For sensitive story text, prefer backend delivery rather than a reusable direct URL.
- A signed URL remains usable until expiry; define its maximum lifetime and revocation expectations explicitly.
- Enable versioning, lifecycle rules, production recovery protections, and restore testing. Bound retained versions and backup retention.
- Restrict upload size/type, avoid serving arbitrary HTML/SVG inline, strip sensitive metadata, and scan uploads before publication where uploads are enabled.
- Store story bodies as sanitized Markdown or structured rich text, not executable user-authored MDX.
- Publication explicitly approves metadata, body revision, assets, and optional AI use. Unpublishing invalidates public pages, retrieval entries, and cached answers.
- Public resume HTML/PDF should derive from the same approved facts to reduce drift.

## 6. Privacy-first migration of existing content

Treat preservation and republication as different operations.

1. Confirm ownership, current hosting, and who can access the live site and its artifacts.
2. Preserve the existing revision and media in a controlled backup before changing routes. Do not create another publicly served archive.
3. Build a content inventory with owner decisions: keep public, rewrite for professional use, member-only, owner-only, or retire.
4. Default unreviewed personal stories and photographs to owner-only in the new system.
5. Create an owner-approved short public career narrative. Do not automatically turn memoir paragraphs into professional claims or public agent context.
6. Move approved private/member bodies out of frontend source/public build inputs. Verify generated HTML, JS, source maps, manifests, previews, search indexes, and agent corpora.
7. Review previously deployed bundles, CDN caches, source maps, public object versions, search-engine results, and external resume links for retirement. A new paywall cannot retract copies already downloaded.
8. Keep historical source controlled. Git history may retain old text and the exposed key; rotation/restriction and artifact cleanup are separate from deleting a current file. Any history rewrite needs separate approval and coordination.
9. Create a full old-to-new URL map from [Main.js](../src/app/Main.js). Public pages get appropriate redirects; formerly public personal URLs get a safe teaser/access page or deliberate retirement response without the old body.
10. Retain hobby integrations only after deciding whether their value justifies maintenance and third-party requests.

Do not use `robots.txt`, `noindex`, hidden navigation, CSS, or a client-side route guard as access control. Use `noindex` as an additional indexing preference on private pages, not their protection.

## 7. Professional resume and leadership portfolio

Build the professional narrative through an owner interview and approved evidence, not assumptions inferred from old stories.

Collect:

- Current positioning, intended audience, leadership scope, and preferred public contact method.
- Accurate roles and dates, team/organizational scope, coaching/hiring experience, cross-functional collaboration, and delivery responsibility.
- Architecture and modernization decisions, tradeoffs, reliability/security improvements, and operating practices.
- Measurable outcomes with permission to publish; mark unknowns as work to gather, not invented metrics.
- The parts of the earlier career that meaningfully explain leadership today, in the owner's voice.
- Project evidence and testimonials only when authorized.

Each case study should explain context, constraints, the owner's actual role, decisions/tradeoffs, outcomes, and lessons. Distinguish individual contributions from team accomplishments. Clearly label historical, active, archived, and confidential projects.

Provide accessible semantic HTML, a readable/printable resume, stable PDF download, descriptive page titles, social previews, canonical URLs, sitemap, and appropriate structured data. Aim for WCAG 2.2 AA; preserve personality through selected design elements without making decorative fonts the default long-form body text.

## 8. Application knowledge and agent behavior

### Approved project knowledge, not unrestricted repository access

Start with manually curated project records. The four links currently in [sideNav.js](../src/app/side-nav/sideNav.js) are an inventory starting point only; verify ownership, current status, publication permission, and what role can be claimed before using them.

Each record should contain:

- Approved public name/alias, purpose, audience, and permitted link.
- The owner's role and involvement dates.
- A high-level architecture and technology summary at the approved disclosure level.
- Approved outcomes, limitations, lessons, and supporting source references.
- Permission/approval status, audience, last verification date, and next review date.
- Separate public summary and owner notes; private client information must never be an input to the public corpus.

Later, an allowlisted connector can produce a **draft snapshot** from approved repository metadata or documents, using minimal read permissions. The owner reviews/redacts it before publication. Do not crawl arbitrary URLs, grant organization-wide access, ingest source by default, or connect to client production data.

Refreshing or deleting a project must invalidate outdated retrieval records and dependent answer caches. The agent must identify stale sources rather than describe an old snapshot as live system status.

### Retrieval and model policy

Start with explicit structured lookups and bounded text retrieval over approved documents. A small curated catalog does not require a vector database, autonomous multi-agent system, or Bedrock Knowledge Base immediately.

- **Public mode:** public profile, published public experience, and approved project summaries only.
- **Member story mode:** only the caller's currently authorized, published, separately AI-approved story revisions.
- Do not include owner drafts, private client notes, secrets, billing records, or other members' conversations.
- Filter by authorization **before retrieval and before model context assembly**, not just after generation.
- Separate public and member retrieval paths; do not build one unrestricted index and trust a prompt to filter it.
- Recheck grants at job execution and result delivery. A queued run must not leak a story after access is revoked.
- Key caches by audience/principal where necessary, exact source versions, and entitlement version. Reauthorize before serving stored results.
- Require resolvable, authorized citations; include "last verified" information for project facts.
- Answer in a clearly labeled assistant voice; do not impersonate the owner, invent experience, or imply current availability/commitments.
- For unsupported questions, say there is not enough approved information and offer an appropriate public source/contact route.
- Treat user prompts and retrieved text as untrusted input. Neither can change tool permissions or system scope.
- Initial tools are read-only and allowlisted. No arbitrary web fetch, code execution, email sending, publishing, payments, or infrastructure actions.

Review the selected Bedrock model's region, retention/logging, inference routing, and data-use terms before sending approved content. Do not enable raw model invocation logging for protected prompts. Disclose AI processing for member story Q&A and provide a non-AI reading experience.

### Agent quality and cost gates

Before release, run a versioned evaluation set covering:

- Accurate professional/leadership questions with source-backed answers.
- Project summaries, stale data, and unapproved client-detail questions.
- Unknown facts and requests to fabricate achievements.
- Prompt injection and attempts to retrieve unpublished or other members' stories.
- Entitlement expiry/revocation while a run is queued or a result is cached.
- Model/provider timeout, queue duplication, throttling, and failed jobs.

Release gates: zero protected-content disclosures in the negative test set; every substantive tested answer has a valid authorized citation or explicitly abstains; no fabricated claims in the curated evaluation set. Track factual quality through owner review rather than treating citation presence as proof of truth.

Set explicit input/output token caps, conversation limits, per-user/IP rate limits, queue concurrency, job expiry, and daily/monthly cost controls. Do not log raw prompts or story text by default. A model outage must not prevent reading the public resume or authorized stories.

## 9. Story access and payments

The publication/access model must work before choosing a payment product.

| Model | Benefits | Costs / limitations | Good initial use |
| --- | --- | --- | --- |
| Subscription | Ongoing support; fits a continuing library | Recurring publishing expectations, churn, dunning, cancellation/grace policies | Choose if regular publishing is a desired commitment |
| One-time purchase | Simple reader proposition; no recurring commitment | Define exactly which edition/collection is included and whether future stories are included | A bounded collection or edition |
| Invited/approved readers | Stronger editorial control; can launch without billing | Manual administration; does not create revenue or prevent copying | Private beta and content/privacy validation |

**Recommendation:** validate with invited readers first, then select one paid model. Support the chosen grant type in the data model without building every billing mode simultaneously.

Define before launch: eligibility, included collections, whether story Q&A is included, renewal/cancellation timing, grace periods, refunds/disputes, free invitations, taxes, support, terms/privacy notices, deletion requests, and minimum necessary reader data.

Payment implementation requirements:

- Create checkout sessions on the backend for allowlisted products/prices. Never accept a client-supplied amount or privileged entitlement.
- Establish entitlement only from verified provider state, not the checkout success redirect.
- Verify webhook signatures against the raw request body; persist event IDs and handle duplicate/out-of-order delivery.
- Reconcile ambiguous or older events against current provider state rather than allowing an old event to restore canceled access.
- Handle delayed payment, failed renewal, cancellation, refunds, disputes, retries, and manual grants through explicit rules.
- Acknowledge only after durable receipt; make asynchronous processing failures visible and recoverable.
- Reconcile provider state periodically and alert on processing failures.
- Revoke access through API, story/media delivery, queued agent jobs, cached results, and MCP consistently.
- Use hosted billing pages; do not store card data.

## 10. MCP layer

The in-app agent and MCP are different consumers of the same governed capabilities. The agent does not need to call MCP internally merely to satisfy the architectural goal.

### Initial owner-only adapter

Implement a local stdio MCP server using the official TypeScript SDK. It authenticates the owner to the backend, uses OS credential storage or an approved credential mechanism, and never embeds credentials in repository configuration.

Initial read-only tools:

- `get_professional_profile`
- `list_projects`
- `get_project_summary`
- `search_approved_knowledge`

Use explicit input/output schemas, bounded pagination/results, source/version metadata, and backend authorization on every call. Define `search_approved_knowledge` as public-approved material initially; owner authentication does not make owner-private retrieval an implicit feature.

Do not expose raw tables, arbitrary SQL/S3 access, arbitrary URLs, or "run anything" tools. Story tools are deferred until story entitlements and AI-content approval have passed tests; any later tool must enforce the same caller/resource rules.

### Remote MCP later, only if needed

A remote endpoint needs a separate deployment/transport decision, Streamable HTTP interoperability testing, appropriate OAuth authorization/discovery, audience-bound tokens, explicit scopes, origin validation, rate limits, and auditability. Do not forward arbitrary incoming bearer tokens to downstream services.

Cognito web authentication alone does not prove compatibility with MCP authorization/client registration requirements. Validate the selected authorization server and intended MCP clients against the then-current protocol. Use a compatible provider/integration if Cognito cannot meet those needs.

Do not publish a remote endpoint with an owner API key as the long-term auth design.

## 11. Dependency and repository cleanup strategy

Run this work at the beginning, not as an afterthought after new features.

1. Preserve the old lockfile/baseline and capture build/test behavior using a controlled runtime. The existing local environment has Node 24.6.0/npm 11.6.2 but no installed `node_modules`; that is not a validated legacy toolchain.
2. Group alerts by actual dependency path and deployed exposure: browser bundle, build system, dev server, and any future server runtime. Prioritize critical/high reachable issues and the exposed integration configuration.
3. If the old site must remain live during migration, make a separate bounded stabilization change for reachable risks; do not leave them untreated while building the replacement. Otherwise restrict/retire affected functionality until replacement is available.
4. Build a fresh maintained workspace dependency graph and port the small application deliberately. Do not carry the entire old dependency tree forward.
5. Remove unused dependencies and consolidate retained YouTube handling. Use a server-side cached playlist endpoint with timeouts, quota limits, and explicit errors, or curated video IDs if sufficient. Decide how to handle playlists larger than the existing 50-item request.
6. Resolve all advisories applicable to the chosen versions; the first patched version shown by one alert is not proof that it fixes every later advisory.
7. Do not run `npm audit fix --force` or bulk automatic major upgrades as the migration strategy.
8. Pin a supported Node LTS and package-manager version, commit the new lockfile, and require clean `npm ci` in CI.
9. Add Dependabot update configuration, dependency review, and a weekly maintenance cadence. Group low-risk updates; separately review framework, infrastructure, auth, and payment majors.
10. Refresh GitHub alerts after merging/deploying the new default-branch dependency graph. Removing a package must be verified through the new lockfile and scanner results, not assumed to close findings.

For implementation, run installed-tree/dependency-path tooling and the organization's approved advisory scanner. Do not upload private code or dependency manifests to an unapproved external service. Document any remaining advisory's exposure, mitigation, owner, and expiry.

Release criterion: no unresolved critical/high finding in a deployed reachable path; no unexplained critical/high build-chain finding. Any exceptional acceptance must be explicit and time-bounded. Track lower-severity items rather than silently dismissing them.

## 12. Delivery roadmap and gates

Phases below are dependency-driven, not calendar promises. Estimate after the content inventory, AWS discovery, and hosting proof of concept.

| Phase | Scope | Depends on | Exit criteria |
| --- | --- | --- | --- |
| 0. Baseline and containment | Verify live hosting/DNS/AWS ownership; controlled backup; content classification; key restriction/rotation; dependency exposure triage; confirm public claims and project permissions. | Owner/AWS access | Every existing route/content item has a disposition; urgent live risks have a fix or containment; no unreviewed private material is approved for migration. |
| 1. Supported monorepo foundation | Hosting proof of concept; npm workspaces/TypeScript; supported framework/runtime; backend skeleton; CDK; CI, dependency automation, dev/prod separation; lean repo instructions and reproducible browser-development setup. | 0 | Clean checkout installs/builds/tests; frontend and API deploy to non-production; auth/caching/workspace proof passes; host/runtime decision documented; a fresh browser environment can run documented checks without production credentials. |
| 2. Public professional release | New landing page, resume HTML/PDF, experience, leadership, approved project case studies, contact, SEO/accessibility, URL migration, retained hobby decisions; styling inventory, approved visual direction, tokens and shared components. | 1 and approved professional content | Professional content works without login/AI; old routes handled deliberately; no protected text in public artifacts; deployment/rollback tested; responsive visual/accessibility acceptance checks pass. |
| 3. Private content foundation | Cognito, owner MFA/admin, revisioned publishing, protected S3, invitations and entitlement checks, member story reader. No paid billing required yet. | 1 and classified stories from 0 | Invite beta readers; prove member A cannot access member B's unauthorized material; drafts stay private; revoke/publish/unpublish/restore tests pass. |
| 4. Public professional agent | Approved project catalog, Bedrock integration, durable jobs, citations, public retrieval, evaluation and cost limits. | 2; agent worker/storage foundation from 1 | Professional evaluation passes; private/client data cannot enter public retrieval; failure/cost controls tested. |
| 5. Member story Q&A | Separate authorized retrieval, per-story AI approval, scoped runs/caches, member disclosure and evaluations. | 3 and 4 | Cross-member, unpublished-content, queued-job revocation, and cache-isolation tests pass. Reading remains usable without AI. |
| 6. Selected paid model | Choose offer; hosted checkout/portal; verified event processing; entitlement reconciliation; policies/support. | 3, owner product decision, and 5 only if Q&A is part of the paid offer | Payment lifecycle/replay/order tests pass in sandbox; deliberate live-mode activation; access agrees with provider state. |
| 7. Owner MCP | Local read-only adapter over approved backend knowledge; credential setup; client interoperability tests and docs. | Approved knowledge/API from 4 | Intended MCP client can discover/call bounded tools; unauthenticated/non-owner access denied; API policy cannot be bypassed. |
| 8. Selective expansion | Approved cross-app snapshot connectors, optional remote MCP, optional streaming, retrieval scaling, analytics-driven improvements. | Relevant prior release and demonstrated need | Each expansion has permission, operating budget, tests, and a decision record; no blanket access to client systems. |

After Phase 1, public portfolio work and the private-content foundation can progress independently. The portfolio does not need to wait for billing, story Q&A, or MCP. Owner MCP does not need to wait for payment.

### Cross-cutting validation

- Unit: authorization rules, entitlement transitions, date formatting, content state, source filtering, job state/idempotency.
- API/integration: real token validation, conditional data writes, signed asset handling, webhook verification, duplicate jobs/events, model errors.
- Browser: anonymous/member/owner routes; direct navigation; keyboard/mobile; checkout sandbox; invitation, expiry, logout and revocation.
- Privacy: inspect production build artifacts, source maps, caches, teasers, indexes, model context, logs, and citations for forbidden content.
- Agent/MCP: contract tests, versioned factual evaluations, injection/refusal tests, client interoperability, credential/scope checks.
- Infrastructure: least-privilege review, environment isolation, deployment smoke tests, backup restore, rollback, and secret rotation.
- Performance: proposed public-page target of mobile Lighthouse performance/accessibility scores of at least 90 in a documented repeatable test profile; supplement with real-user Core Web Vitals when traffic allows. Agree on device/network/page set before treating the score as a release metric.

## 13. Operations, environments, and cost controls

- Use local development plus isolated non-production and production resources; prefer separate AWS accounts for production. Never copy real private stories into previews or routine test fixtures.
- Public-only branch previews may be useful; do not wire arbitrary preview builds to production secrets, identity, or protected buckets.
- Restrict GitHub OIDC trust by repository/environment/ref; use protected production deployment approval.
- Log request IDs, job/event state, and redacted errors. Keep raw story bodies, tokens, payment payload details, and private chat prompts out of routine logs.
- Alert on webhook/worker failures, dead-letter messages, model throttling/spend, authentication anomalies, API failures, and backup issues.
- Set bounded retention for chat/job data; prefer ephemeral conversations initially. Audit metadata must not become a second unprotected copy of personal writing.
- Use DynamoDB recovery and S3 versioning/lifecycle with a documented recovery procedure. Run a restore exercise before paid launch.
- Version frontend/backend contracts so rollback does not break sessions or entitlements. Rehearse DNS/deployment rollback; retain the previous approved public deployment.
- Define deletion/export, consent, retention, support, account recovery, and incident-response procedures before collecting reader data.
- Review advertising/analytics deliberately. Remove inherited advertising by default in the new experience unless explicitly retained; do not send protected content to analytics/ad networks.

Before provisioning, use the AWS Pricing Calculator for the actual region, traffic, model, and environment count. Include Amplify build/compute, API/Lambda/SQS, DynamoDB, S3/CloudFront transfer, Cognito, Bedrock tokens, logs, backups, secrets, domain/email, and payment-provider fees. ECS/ALB/NAT can introduce material fixed costs if the hosting fallback is selected.

Set owner-approved monthly budgets separately for infrastructure and AI before public release. Budget alerts are not hard spend caps: enforce application rate/token/concurrency controls and an agent-disable switch that leaves the portfolio and reader intact. Specific dollar limits, latency SLOs, and recovery targets remain owner decisions, not estimates asserted by this document.

## 14. Decisions still needed

| Decision | Recommendation / information needed | Needed before |
| --- | --- | --- |
| Professional positioning and facts | Owner interview, current approved resume, evidence of scope/outcomes, desired visitor action | Phase 2 content completion |
| Existing AWS/deployment ownership | Identify account, region, Amplify app if any, DNS/certificates, billing access, current deployment permissions | Phase 0 / any cutover |
| Framework/host versions | Run compatibility proof; choose supported patched versions, not simply highest npm major | Phase 1 |
| Story boundaries | Owner reviews each story/asset, explicit teasers, per-story AI permission; unreviewed stays owner-only | Phase 3 |
| Commercial offer | Invited beta first; then select subscription or a defined one-time collection | Phase 6 |
| Project disclosure | List other apps, publication permissions, approved role/architecture/outcome summaries; no repo access assumed | Phase 2 / agent ingestion |
| Contact and branding | Deliberately select professional contact, visual continuity, advertising/analytics policy | Phase 2 |
| Visual direction | Provide two or three reference sites and what should be retained or retired from the current identity; approve a landing-page/component sample before styling every route | Phase 2 |
| Career context | Supply reviewed recent resume and policy-permitted, sanitized career summary from the work workspace; reconcile contradictions before publication | Phase 2 |
| Portable development | Personal VS Code plus browser development; phone/tablet for issues, review, and explicit approvals; choose browser provider, budget, and private-network/secrets policy | Phase 1 |
| Content authoring UX | Start with a small owner-only editor and revision/publish workflow; consider a CMS only if editorial needs exceed it | Phase 3 |
| Model/data residency | Bedrock model/region, permitted data routing/logging/retention and inference budget | Phase 4 |
| MCP clients and remote need | Name intended client(s); stdio owner-only first; remote is opt-in later | Phase 7 / optional Phase 8 |
| Budget/operations | Monthly budgets, alarms, recovery expectations, maintenance ownership | Before production provisioning |

### First implementation backlog

1. Record the live deployment/AWS/DNS inventory and make a controlled backup.
2. Triage the exposed YouTube key and critical/high dependency paths; contain live risk.
3. Create the content/route disposition inventory with owner approvals.
4. Gather the current professional resume and an approved project-summary template.
5. Run the framework/Amplify workspace proof of concept and decide exact runtime versions.
6. Establish the fresh workspace, CI, dependency automation, reproducible deploy, and portable-development instructions.
7. Approve a professional visual direction and shared component sample, then migrate retained screens consistently.
8. Ship the professional portfolio before layering on commercial or agent complexity.

## 15. Styling audit and professional design system

### Findings from the current CSS

The source inventory contains 12 CSS files. This is a source-level styling review, not a rendered visual or contrast audit.

| Finding | Evidence | Planned correction |
| --- | --- | --- |
| Competing typography | [index.css](../src/index.css) sets a system body font, [App.css](../src/App.css) applies RockSalt through `*`, [woodshop.css](../src/app/woodshop/woodshop.css) sets another global body font, and [page-header.css](../src/shared-components/page-header/page-header.css) uses Edo. | One readable body/heading hierarchy; decorative branding only in explicitly approved places. |
| Cross-page style leakage | [woodshop.css](../src/app/woodshop/woodshop.css) defines global `.column`, `.row`, `.card`, and `body`; [workouts.css](../src/app/workouts/workouts.css) styles all table cells/alternating rows; [plyobox.css](../src/app/woodshop/plyobox.css) styles all labels and strong text. | Scope feature styles; reserve global CSS for reset, tokens, and documented base elements. |
| Fragile layouts | Floated percentage columns, fixed 250/400px card heights, fixed image sizes, and fixed-position footer appear across [about.css](../src/app/about/about.css), [woodshop.css](../src/app/woodshop/woodshop.css), [card.css](../src/shared-components/card/card.css), and [footer.css](../src/app/footer/footer.css). | Responsive grid/flex layouts, content-driven heights, bounded media, readable text measure, and a non-obstructing application shell. |
| Inconsistent state styling | Colors are repeated as hex/RGB literals; navigation changes styles directly and uses `outline: none` in [sideNav.css](../src/app/side-nav/sideNav.css). | Semantic color tokens and explicit hover, focus-visible, active, expanded, disabled, error, and loading states. |
| Limited responsive coverage | Breakpoints are isolated rather than a coherent page/component system; video dimensions are fixed in the YouTube screens. | Content-driven breakpoints, responsive embeds/tables/forms, and route-level small-screen checks. |

### Design approach

1. Inventory every retained route and shared element, including later member/admin/agent screens. Capture representative baseline screenshots only in an approved environment; keep protected content out of shared screenshots.
2. Gather two or three visual references and define the intended impression: professional, approachable, readable, and evidence-led. Decide deliberately which existing colors, signature/logo, and personal touches survive.
3. Approve a sample landing page, resume section, story reading view, and component sheet before applying a full redesign.
4. Define semantic CSS variables for surfaces, text, borders, actions, status, typography, spacing, radii, shadows, container widths, and motion. Do not add dark mode unless requested.
5. Default to CSS Modules for component/feature styling and small shared global token/base files. Choose one component approach; evaluate existing library usage before introducing or upgrading a design library. Do not combine multiple UI kits or add a large framework solely for styling.
6. Build reusable navigation, page headers, buttons/links, cards, form fields, alerts, empty/loading/error states, media frames, and chat/citation patterns. Distinguish public, member, and owner experiences through clear navigation without creating separate visual languages.
7. Apply the system to all retained screens; remove obsolete global selectors and duplicate styles as their consumers migrate. Keep the plyobox calculator and other retained interactions functionally tested during visual changes.

### Visual acceptance criteria

- Verify representative public, story, account, admin, and agent states at 320, 768, and 1440 CSS-pixel viewport widths. Test intermediate sizes when the layout changes.
- No unintended horizontal page scrolling, clipped text, hidden controls, or footer/header overlap. Tables may have deliberate, labeled overflow containers.
- Check reflow at 200% text zoom and equivalent 320 CSS-pixel width; verify keyboard navigation, visible focus, mobile menu dismissal/focus return, reduced motion, and screen-reader labels.
- Meet WCAG 2.2 AA, including at least 4.5:1 normal text contrast, 3:1 large text contrast, and applicable non-text contrast/target-size criteria. An automated score alone does not establish accessibility.
- Verify readable long-form line length, clear resume print/PDF output, responsive media, and consistent component states.
- Add browser screenshots/visual regression checks for representative routes after the approved baseline exists. Do not maintain a separate visual test for every trivial variation.
- Record design tokens, component usage, deliberate exceptions, reference screenshots, and review procedure in a short design-system guide when implementation begins.

## 16. Portable development and efficient agent collaboration

### Cross-device working model

- **Personal laptop / VS Code:** primary implementation, local debugging, browser validation, and owner-reviewed content editing.
- **Browser environment:** propose GitHub Codespaces with a versioned dev-container configuration after selecting the runtime. Document equivalent setup if another provider is chosen. This is a proposal, not an enabled service.
- **Phone/tablet:** create/refine issues, answer bounded questions, inspect previews/CI, review PRs, and approve explicitly requested actions. Do not rely on a phone session to hold unique project context or production credentials.
- **Cloud coding agent, if enabled:** assign only bounded, ready issues. Validate its repository instructions, permissions, supported skills/tools, secret access, and billing on the actual host. VS Code skills/settings are not automatically available to every cloud agent.
- Keep application runtime agent/MCP behavior separate from coding-agent configuration. Configuring a coding skill does not give the deployed assistant knowledge or authority.

Use branches and PRs as the durable implementation handoff. After review, push approved commits so another device can resume; a local uncommitted plan or session is not cross-device persistence. Never auto-commit/push confidential source material or raw career exports. Browser environments use synthetic fixtures, ignored local configuration, and non-production resources only. Set idle timeouts/compute limits and do not assume Codespaces or coding-agent usage is free.

### Minimal customization set, added in Phase 1

No agent configuration is created by this planning update. Start repo-scoped, versioned, and small:

| Primitive | Proposed responsibility | When to add |
| --- | --- | --- |
| `.github/copilot-instructions.md` | Short always-on map: actual architecture, authoritative docs, verified commands, public/member/owner boundaries, change/validation expectations, and required task handoff. State explicitly which architecture is proposed versus implemented. | First implementation setup; use one root source of instructions rather than duplicating it in `AGENTS.md`. |
| `.github/instructions/*.instructions.md` | Narrow `applyTo` rules for frontend styling/accessibility, backend access/payment rules, infrastructure, and agent/MCP code. Match actual paths as they exist. | With each surface, not speculative rules for empty folders. |
| `.github/prompts/*.prompt.md` | Short opt-in start/resume and finish/handoff tasks referencing issue/PR context; inputs are issue ID, scope, acceptance criteria, and next action. | When the workflow is first exercised. |
| `.github/skills/ui-consistency-review/SKILL.md` | Repeatable route/state inventory, token/component checks, viewport screenshots and accessibility checks, with reusable fixtures/checklists if needed. | First visual migration, once the browser commands are verified. |
| `.github/skills/approved-content-intake/SKILL.md` | Reconcile owner-approved sources, flag conflicting facts, distinguish public/private approval, and produce reviewable factual changes. No automatic publication or work-system access. | When career/project content intake becomes recurring. |
| Custom agent definitions | None required initially. Consider a read-only reviewer or bounded implementation role only if a recurring task benefits from isolated context/tool restrictions. | Demonstrated need; reuse existing capabilities before adding agents. |
| CI checks / hooks | Put reproducible checks in scripts/CI; add host-supported hooks only for a demonstrated enforcement gap. | With working validation commands; instructions alone are not enforcement. |

Do not create one agent for each planned subsystem. Skills describe repeatable procedures; prompts are single task entry points; instructions carry stable invariants. Keep names/descriptions discoverable, use scoped globs, avoid overlapping rules, and verify that the chosen clients actually load them. Never place biographies or lengthy architecture documents in always-on instructions.

### Documentation needed, without a second planning bureaucracy

Create/update each document when its capability arrives; the list below is a documentation backlog, not a request to create empty files.

| Durable source | Minimum useful contents |
| --- | --- |
| README / quickstart | Actual runtime, clean install, local start, scoped tests/lint/build, required configuration names, synthetic fixtures, and links to deeper docs. Mark proposed commands as unverified until executed. |
| This plan + small decision records | Roadmap and approved architectural tradeoffs; record only consequential choices, alternatives, and rationale. |
| GitHub issues / PRs | One source of task status, prerequisites, bounded scope, acceptance criteria, tests run, remaining risks, and next step. Do not mirror the backlog in several Markdown files. |
| Design-system guide | Approved visual direction, tokens, component/state usage, viewport/accessibility checks, and screenshots without protected content. |
| Approved career/project content | Reviewed factual claims, source date, approval state, public wording, and unresolved gaps. Keep raw resume/work exports in approved private storage, not automatically in Git. |
| API/access documentation | Public/member/owner policy, endpoint/tool contracts, entitlement lifecycle, content publication and revocation behavior. |
| Environment/deployment runbook | Configuration names and retrieval process, non-production setup, CI/deployment, rollback/restore, budget controls, and who approves production actions. No secret values. |
| Agent/MCP guide | Approved corpus, citation/refusal policy, evaluations, costs, client setup, permissions, and known limitations. |

Keep the current phase, ready next issue, and blockers discoverable from linked issues/PRs. Use a short end-of-task handoff: changed scope, verification command/result, unresolved decision, and next actionable step. Do not require reading the whole plan or old chat transcripts to make a small change.

### Time and token-cost discipline

- Prepare work as small vertical slices: one user outcome, explicit files/area where known, a clear stop condition, and measurable acceptance criteria.
- Start each session from the issue, branch/commit, and relevant docs. Read only the sections needed; summarize rather than pasting full chat histories or entire repositories.
- Keep stable invariants in short instructions and large procedures in on-demand skills/docs. Avoid automatic loading of the full plan.
- Resolve high-impact decisions once and document them; do not have every agent rediscover the architecture, styling rules, or approved career facts.
- Prefer one implementation agent/session and focused checks; parallelize/delegate only truly independent work needing separate context, not routine editing or repeated review.
- Use the lightest model/capability that reliably handles the task where host controls permit; reserve deeper reasoning for architecture, authorization, and difficult failures. Do not bake model names into repo instructions.
- Run the smallest covering test/check set first, preserve concise failure evidence, and use CI for repeatable gates. Do not claim tests passed when only source was inspected.
- Bound retries and ask one batch of specific questions when blocked. Record the blocker instead of spending repeated runs guessing.
- Review coding-agent usage and runtime-model spending separately; track useful completed outcomes, not token counts alone. Do not promise a savings percentage before measuring a baseline.

## 17. Career-context intake and owner inputs

The recent resume can fill the post-2020 timeline; approved context from the work Copilot workspace can add leadership progression and examples absent from a resume. Neither source is assumed complete, current, authorized for export, or approved for publication.

Use the [career-context export prompt](career-context-export-prompt.md) in the work workspace only if employer policy permits. It requests a sanitized Markdown draft for manual review, not an automatic transfer, repository connection, or publication.

### Intake workflow

1. Owner checks employer policy and selects only sources permitted for this personal project. A personal approval cannot override employer/client confidentiality.
2. Work assistant drafts only approved-for-external-use career facts at an appropriate abstraction level; unknowns/conflicts stay explicit. No raw work chat, source code, internal documents, identifying coworker/customer details, or confidential metrics.
3. Owner reviews/redacts the Markdown before bringing it here, alongside a reviewed recent resume. Sending a draft for planning is not permission to publish it or ingest it into the public agent.
4. Reconcile roles/dates/scope across the recent resume, approved summary, and existing public site. Ask about contradictions instead of silently choosing a source.
5. Owner approves exact public wording and supporting evidence. Only then add approved public content to the portfolio and agent corpus.
6. Retain source provenance/review date in approved private storage; store only the permitted public facts and non-sensitive approval metadata with public content. Do not turn full raw exports into always-on coding-agent context.

### Highest-value gaps the owner can fill

| Input | Why it saves rework | Minimum useful answer |
| --- | --- | --- |
| Reviewed recent resume + approved work summary | Establishes a trustworthy timeline and leadership examples | Correct roles/dates, public-safe responsibilities, three to five impact examples, unresolved facts explicitly marked |
| Intended professional audience | Determines navigation, tone, and what accomplishments lead | Target roles/readers and the action they should take |
| Two or three design references | Avoids a full redesign based on guessed taste | Links plus what is appealing; current colors/logo/fonts to retain or retire |
| Project publication boundaries | Prevents unusable case studies or confidentiality problems | App alias/name, actual role, public-safe summary, link permission, allowed outcomes |
| Story classification | Prevents accidental republication | Public/member/owner/retire decision per existing story and separate AI permission |
| AWS ownership and budget | Unblocks platform proof/deployment without guesses | Account/region/resource inventory through a secure process, spending limits, and approval expectations; no credentials in chat |
| Work cadence and first priority | Keeps tasks small enough for short sessions | Typical session length, preferred first milestone, browser-provider constraints, and when owner review is available |

First useful content handoff: the reviewed resume, a sanitized Markdown career summary, and a short list of facts that must not be published. Private exclusions themselves should not contain confidential details; descriptions such as "omit customer identities" are sufficient.

## 18. Sources and evidence handling

Repository links above describe the inspected baseline; code may change during implementation. Dependency counts are a point-in-time snapshot and must be refreshed.

Read-only GitHub checks used repository metadata, the Dependabot alerts API, Actions workflow metadata, and open Dependabot-authored PR listing. Raw alert output and private-source content are intentionally not copied into this document.

Official documentation consulted:

- [React: Sunsetting Create React App](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)
- [AWS: Amplify support for Next.js](https://docs.aws.amazon.com/amplify/latest/userguide/ssr-amplify-support.html)
- [AWS: Amplify monorepo configuration](https://docs.aws.amazon.com/amplify/latest/userguide/monorepo-configuration.html)
- [AWS: Amazon Bedrock data protection](https://docs.aws.amazon.com/bedrock/latest/userguide/data-protection.html)
- [Stripe: webhook handling](https://docs.stripe.com/webhooks)
- [MCP: authorization specification](https://modelcontextprotocol.io/specification/latest/basic/authorization)

Documentation and package support change. Revalidate hosting capabilities, security support, provider terms, payment behavior, and the MCP specification before implementation.
