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

## Preparing GitHub Pages

The repository is private. GitHub Pro permits a public Pages site from a private personal repository; private source does not make the published site private.

Publication is intentionally **manual only**. No push triggers deployment. The checks workflow validates pushes and PRs without publishing.

After owner review and explicit release approval:

1. Commit and push the reviewed changes to `master`; do not include raw resume/work exports.
2. In repository **Settings → Pages**, choose **GitHub Actions** as the publishing source.
3. Ensure the `github-pages` environment permits deployment from `master`; configure required owner approval if desired.
4. Run **Publish professional profile** from the **Actions** tab on `master`.
5. Share the URL returned by the deploy job. Without a custom domain, the expected project URL is `https://ctenerd.github.io/roddy.tomlin.life/`.

The workflow reads the configured Pages base path, checks/tests/builds, and uploads only `dist/`. It does not configure DNS, change repository visibility, or enable Pages automatically.

Test the project subpath locally before release:

```sh
BASE_PATH=/roddy.tomlin.life/ npm run build
BASE_PATH=/roddy.tomlin.life/ npm run preview
```

Open the preview URL with `/roddy.tomlin.life/` appended. For a root/custom-domain build, omit `BASE_PATH`.

No `CNAME` is included. `roddy.tomlin.life` did not resolve during the November 3 discovery; its DNS and any old Amplify deployment must be inspected separately. Do not promise that address or disable an old deployment until its ownership and replacement are verified. Test the returned Pages URL, assets, contacts, mobile layout, and a retired path after deployment.

GitHub Pages is an interim static-profile host. Move paid stories, authenticated content, payments, agent execution, and MCP to the planned backend-capable hosting; never implement a client-side paywall on Pages.

## Next steps

- [Modernization plan](docs/modernization-plan.md): longer-term AWS-first monorepo, public resume, protected stories, agent/MCP, and delivery gates.
- [Career-context export prompt](docs/career-context-export-prompt.md): controlled intake for owner-reviewed career material.

Next content work includes owner review of the rendered timeline, a corrected downloadable resume, approved project outcomes, and a protected story-access model.
