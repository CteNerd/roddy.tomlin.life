# Roddy Tomlin | Engineering Leadership

A public professional profile built with React and Vite. This is the November 2026 interim release, not the planned full-stack platform. The site has no authentication, paywall, agent, or backend.

## Local development

Use Node 24 (see `.nvmrc`) and npm 11.6.2.

```sh
nvm use
npm ci --no-audit --no-fund
npm start
```

The development server binds to loopback. Do not expose it publicly: the private repository still contains historical personal source files. Share only a reviewed production deployment.

```sh
npm run lint
npm test
npm run build
npm run preview
```

The build prerenders the homepage and a separate `experience.html` page into HTML, then hydrates each for its print button. Reading, navigation, and contact links work without JavaScript. `dist/` is the only deployable directory.

The homepage introduces the owner-confirmed NFL background (Jacksonville Jaguars and Atlanta Falcons) without importing the old memoir. The full engineering timeline and education live on the Experience page to shorten the homepage, especially on mobile. No football dates, roster status, statistics, or unsupported outcomes are asserted. Both pages use base-path-aware links and assets; direct loads/refreshes of `experience.html` work on static hosting without a router fallback.

## Public-content boundary

- `src/App.jsx` and `src/profile.js` contain the deliberately limited public profile. The owner confirmed the title, FMG, high-level focus themes, and contact details on November 3, 2026. A reviewed resume-derived timeline includes employers, roles, dates, qualitative contributions, and education; the owner confirmed the director promotion as February 2026. The Integrate return is shown as separate periods rather than continuous employment.
- Supplied resume documents/PDF remain outside the repo and release. Conflicting metrics, internal operational details, individual performance information, and stale duration claims are omitted. A corrected PDF is deferred pending timeline review; use print/save on the Experience page to include the full timeline.
- The raw career dossier is not approved public copy and is not included in this repository or release.
- Historical memoir/hobby components and media remain private source for later review. They are not imported by the public entry point.
- `site-public/` is the only copied static-assets folder. The historical `public/` folder is **not** copied.
- Two owner-supplied professional portraits are approved public assets: `roddy-headshot.jpg` and `roddy-seated.jpg`. Only resized/cropped web copies are included (each under 200 KB); originals remain untouched outside the repo. JPEG application metadata, including EXIF/GPS/IPTC and comments, is removed and rejected by the release check. Images use base-path-aware URLs, explicit dimensions, and alternative text; the seated image loads lazily and both are omitted from print.
- The Vite build rejects unapproved local modules; release checks allow only expected output types and reject known legacy integration/personal-content markers. Source maps are disabled.
- `404.html` contains the same safe public profile, so retired story URLs do not recover their old content. It remains an HTTP 404 on Pages, not a redirect or an authenticated archive.
- No old resume download, advertisements, analytics, video/API integrations, family photos, or memoir routes are published.

Run `npm run check:release` after a build to repeat the output checks. These checks protect this build boundary; they do not retract prior deployments, caches, Git history, or downloaded copies.

Legacy components are intentionally excluded from active lint/test selectors and cannot run independently with the retired dependencies. Do not re-enable them without content approval, dependency review, and authorization design.

## AWS hosting

The original repository must stay private: its legacy personal source and Git history are not approved public content. It was briefly public during Pages setup; restoring privacy cannot retract downloaded copies. An exposed legacy Google API key requires provider-side revocation, even after source removal. Never treat release checks as protection for public Git history.

Production uses a private, encrypted S3 bucket behind CloudFront with origin access control, HTTPS, and Route 53 records for `roddy.tomlin.life`. Only reviewed `dist/` output is uploaded. Missing/retired routes return the safe profile with HTTP 404. The bucket is not a public website endpoint.

Infrastructure is defined in [profile-hosting.yml](infrastructure/profile-hosting.yml). Provision the stack in `us-east-1` so its ACM certificate can be used by CloudFront:

```sh
aws cloudformation deploy \
  --region us-east-1 \
  --stack-name roddy-profile-hosting \
  --template-file infrastructure/profile-hosting.yml \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides HostedZoneId=YOUR_ZONE_ID GitHubOidcProviderArn=YOUR_EXISTING_GITHUB_OIDC_PROVIDER_ARN
```

Confirm the zone's nameservers match public delegation before deployment. The stack adds only the explicit profile hostname and its certificate validation record; it does not replace unrelated wildcard/subdomain records. S3/CloudFront usage charges apply. The bucket is retained on stack deletion; DNS, CDN, IAM, and certificate resources are managed by the stack.

Configure the GitHub `aws-production` environment with a branch deployment policy allowing only `main`. Set these environment variables from the stack outputs (these are identifiers, not credentials):

- `PROFILE_BUCKET`: `BucketName`
- `PROFILE_DISTRIBUTION`: `DistributionId`
- `PROFILE_DEPLOY_ROLE`: `DeploymentRoleArn`

The pinned **Publish profile to AWS** workflow is manual only and accepts `main` only. It checks/tests/builds, assumes a narrowly scoped AWS role through GitHub OIDC, publishes assets before HTML, invalidates the CDN, and verifies both pages plus a retired route. No long-lived AWS keys are stored in GitHub. It intentionally retains older approved assets so visitors with cached HTML are not broken during releases.

Require PR checks and prevent branch deletion/force-pushes where the GitHub plan permits. Use read-only default Actions permissions and disable Actions PR approval. In the current private repository, GitHub rejected branch protection and secret scanning as unavailable under the effective entitlement; these safeguards remain pending an eligible plan. Dependency security updates are enabled. Do not make the repository public to enable these features.

### Pending Google credential remediation

The legacy YouTube key remains unresolved; restoring source privacy does not revoke it. Sign into [Google Cloud API credentials](https://console.cloud.google.com/apis/credentials) using the accounts that owned the old YouTube integration and use the project picker to inspect candidate projects. Check key names, creation dates, API/application restrictions, and API usage; do not paste key values into issues, chat, logs, or commits. The old screen existed by January 2021, which may help locate its project.

Once ownership is established, revoke the exposed key and inspect usage/quota/billing for unexpected activity. If another application still depends on it, migrate that application to a restricted replacement first. Then remove the three legacy source copies in a reviewed change. History remains sensitive even after source removal; do not make this repository public without a separate approved history/content cleanup. No Google Cloud account access or key validity has been verified from this environment.

## Optional GitHub Pages fallback

GitHub Pages is not the selected production host. Private-source Pages requires an eligible GitHub plan; the current effective entitlement did not permit it. Do not make the original repository public to enable Pages. Private source does not make any published site private.

Publication is intentionally **manual only**. No push triggers deployment. The checks workflow validates pushes and PRs without publishing.

After owner review and explicit release approval:

1. Commit and push the reviewed changes to `main`; do not include raw resume/work exports.
2. In repository **Settings → Pages**, choose **GitHub Actions** as the publishing source.
3. Ensure the `github-pages` environment permits deployment from `main`; configure required owner approval if desired.
4. Run **Publish professional profile** from the **Actions** tab on `main`.
5. Share the URL returned by the deploy job. Without a custom domain, the expected project URL is `https://ctenerd.github.io/roddy.tomlin.life/`.

The workflow reads the configured Pages base path, checks/tests/builds, and uploads only `dist/`. It does not configure DNS, change repository visibility, or enable Pages automatically.

Test the project subpath locally before release:

```sh
BASE_PATH=/roddy.tomlin.life/ npm run build
BASE_PATH=/roddy.tomlin.life/ npm run preview
```

Open the preview URL with `/roddy.tomlin.life/` appended. For a root/custom-domain build, omit `BASE_PATH`.

No `CNAME` is included. `roddy.tomlin.life` is reserved for the AWS deployment above. Do not point it to Pages while the AWS stack manages its DNS. Test the returned Pages URL, assets, contacts, mobile layout, and a retired path after any fallback deployment.

GitHub Pages is an interim static-profile host. Move paid stories, authenticated content, payments, agent execution, and MCP to the planned backend-capable hosting; never implement a client-side paywall on Pages.

## Next steps

- [Modernization plan](docs/modernization-plan.md): longer-term AWS-first monorepo, public resume, protected stories, agent/MCP, and delivery gates.
- [Career-context export prompt](docs/career-context-export-prompt.md): controlled intake for owner-reviewed career material.

Next content work includes owner review of the rendered timeline, a corrected downloadable resume, approved project outcomes, and a protected story-access model.
