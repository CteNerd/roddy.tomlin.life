# Founder reporting frontend

This is a separate, non-prerendered application for the `/founder/` route. The
normal site build places its shell and assets under `dist/founder/`; it does not
add Founder routes to the public sitemap or load reports into static HTML.
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

The current profile host is not managed by this repository. Before publishing,
configure only the explicit `/founder` and `/founder/` paths to serve this
directory, preserve existing retired-route 404 behavior, inject validated
public configuration, and verify Cognito callbacks and API CORS. No live
deployment or route change is performed by these commands.
