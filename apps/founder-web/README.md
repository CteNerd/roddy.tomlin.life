# Founder reporting frontend

This is a separate, non-prerendered application for the `/founder/` route. Its
shell and assets are emitted to `founder-dist/`, outside the public profile's
`dist/` artifact used by the existing publishers. It does not add Founder
routes to the public sitemap or load reports into static HTML.
Report requests are made only after sign-in, and the API remains responsible
for validating the owner subject.

The browser uses Cognito managed login with authorization code + PKCE, validates
the returned issuer/client/token-use/nonce/expiry claims, and keeps the access
token in memory only. PKCE state and verifier are kept in session storage only
for the redirect round trip. A reload requires signing in again. MFA is enforced
by the Cognito pool; the browser client has no secret.

Build-time configuration is public runtime configuration, never secrets:

| Variable | Source |
| --- | --- |
| `VITE_FOUNDER_AUTH_URL` | Founder infrastructure output `AuthUrl` |
| `VITE_FOUNDER_CLIENT_ID` | Founder infrastructure output `UserPoolClientId` |
| `VITE_FOUNDER_USER_POOL_ID` | Founder infrastructure output `UserPoolId` |
| `VITE_FOUNDER_API_URL` | Founder infrastructure output `ApiUrl` |
| `VITE_FOUNDER_CALLBACK_URL` | Exact Cognito callback, ending in `/founder/` |

These values are intentionally absent by default, leaving sign-in disabled.
Never add a client secret, owner subject, access token, report data, or
environment-specific credentials to the frontend configuration.

For local development, create an ignored `.env.local` in this directory using
the development stack outputs, set the callback to
`http://localhost:5174/founder/`, then run:

```sh
npm run dev:founder
```

The development pool/API must already be deployed and its owner explicitly
provisioned before a real sign-in can succeed. Build and test without AWS using
`npm run build` and `npm test` from the repository root.

### Synthetic dashboard rehearsal

To exercise the actual dashboard cards, month selector, refresh control, and
error states without Cognito, AWS, or source data, run this explicit
development-only mode from the repository root:

```sh
npm run dev:uat --workspace @rct/founder-web
```

Open <http://localhost:5184/founder/>. The command opts in with
`VITE_FOUNDER_UAT_REHEARSAL=1`; the app additionally requires Vite development
mode and the loopback `localhost` hostname. The fixture loader is dynamically
imported only behind those checks and feeds the same aggregate response parser
used by the live dashboard. It makes no network requests.

In “Synthetic monthly timeline,” select `2026-09` to see an observed zero with
a source timestamp, `2026-10` to see no recorded projections (not zero
activity), and `2026-11` to see populated totals including a signed negative
correction. Change months and use “Refresh report” to repeat a request. The
other response choices exercise an expired-session `401`, service `503`, and
malformed aggregate response.

This is synthetic local UI rehearsal only—not authentication, event-delivery,
or DynamoDB certification. It does not activate or simulate an owner session,
prove MFA, read live data, or validate live infrastructure. Normal
`npm run dev:founder --workspace @rct/founder-web` remains the PKCE sign-in
flow on `localhost:5174`; production builds do not include the fixture module.
Real owner-MFA provisioning and authorized live aggregate data remain separate
gates.

The current profile host is not managed by this repository. Before publishing,
configure only the explicit `/founder` and `/founder/` paths to serve the
separately gated `founder-dist/` artifact, preserve existing retired-route 404
behavior, inject validated public configuration, and verify Cognito callbacks
and API CORS. No live deployment or route change is performed by these commands.
