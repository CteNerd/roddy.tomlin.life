import { founderIssuer, isFounderConfigurationValid } from "./config.js";

const pendingAuthKey = "rct-founder-pkce";

function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function randomValue(cryptoApi, length = 32) {
  const bytes = cryptoApi.getRandomValues(new Uint8Array(length));
  return base64Url(bytes);
}

async function challengeFor(cryptoApi, verifier) {
  const digest = await cryptoApi.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

function decodeClaims(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) throw new Error();
    const base64 = payload.replaceAll("-", "+").replaceAll("_", "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
    const claims = JSON.parse(new TextDecoder().decode(bytes));
    if (!claims || typeof claims !== "object" || Array.isArray(claims)) throw new Error();
    return claims;
  } catch {
    throw new Error("Sign-in could not be verified.");
  }
}

function validExpiry(exp, now) {
  return Number.isSafeInteger(exp) && exp * 1000 > now();
}

export function createAuthClient(
  configuration,
  {
    cryptoApi = globalThis.crypto,
    storage = globalThis.sessionStorage,
    fetchImpl = globalThis.fetch,
    location = globalThis.location,
    history = globalThis.history,
    now = Date.now,
  } = {},
) {
  const configured = isFounderConfigurationValid(configuration);
  let accessToken = null;

  function requireConfiguration() {
    if (!configured) throw new Error("Founder sign-in is not configured.");
  }

  function getCallbackUrl() {
    return new URL(configuration.callbackUrl);
  }

  function clearCallbackUrl() {
    history.replaceState(null, "", getCallbackUrl().pathname);
  }

  async function beginSignIn() {
    requireConfiguration();
    const verifier = randomValue(cryptoApi, 32);
    const state = randomValue(cryptoApi);
    const nonce = randomValue(cryptoApi);
    const challenge = await challengeFor(cryptoApi, verifier);
    storage.setItem(pendingAuthKey, JSON.stringify({ verifier, state, nonce }));

    const authorization = new URL("/oauth2/authorize", configuration.authUrl);
    authorization.search = new URLSearchParams({
      client_id: configuration.clientId,
      response_type: "code",
      scope: "openid",
      redirect_uri: configuration.callbackUrl,
      code_challenge_method: "S256",
      code_challenge: challenge,
      state,
      nonce,
    });
    location.assign(authorization.href);
  }

  async function completeSignIn(currentUrl) {
    const current = new URL(currentUrl);
    if (!["code", "state", "error"].some((key) => current.searchParams.has(key))) return null;
    requireConfiguration();
    const callback = getCallbackUrl();
    if (current.origin !== callback.origin || current.pathname !== callback.pathname) return null;

    const pendingText = storage.getItem(pendingAuthKey);
    storage.removeItem(pendingAuthKey);
    clearCallbackUrl();
    if (current.searchParams.getAll("error").length > 1
      || current.searchParams.has("error")
      || current.searchParams.getAll("code").length !== 1
      || current.searchParams.getAll("state").length !== 1
      || !pendingText) {
      throw new Error("Sign-in was not completed.");
    }

    let pending;
    try {
      pending = JSON.parse(pendingText);
    } catch {
      throw new Error("Sign-in could not be verified.");
    }
    if (typeof pending?.verifier !== "string"
      || typeof pending?.state !== "string"
      || typeof pending?.nonce !== "string"
      || !current.searchParams.get("code")
      || current.searchParams.get("state") !== pending.state) {
      throw new Error("Sign-in could not be verified.");
    }

    const issuer = founderIssuer(configuration.userPoolId);
    if (current.searchParams.getAll("iss").length > 1
      || (current.searchParams.has("iss") && current.searchParams.get("iss") !== issuer)) {
      throw new Error("Sign-in could not be verified.");
    }

    const tokenUrl = new URL("/oauth2/token", configuration.authUrl);
    const response = await fetchImpl(tokenUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      cache: "no-store",
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: configuration.clientId,
        code: current.searchParams.get("code"),
        redirect_uri: configuration.callbackUrl,
        code_verifier: pending.verifier,
      }),
    });
    if (!response.ok) throw new Error("Sign-in could not be completed.");

    let tokens;
    try {
      tokens = await response.json();
    } catch {
      throw new Error("Sign-in could not be verified.");
    }
    if (tokens?.token_type !== "Bearer"
      || typeof tokens.access_token !== "string"
      || typeof tokens.id_token !== "string") {
      throw new Error("Sign-in could not be verified.");
    }

    const accessClaims = decodeClaims(tokens.access_token);
    const idClaims = decodeClaims(tokens.id_token);
    if (accessClaims.iss !== issuer
      || accessClaims.token_use !== "access"
      || accessClaims.client_id !== configuration.clientId
      || !validExpiry(accessClaims.exp, now)
      || idClaims.iss !== issuer
      || idClaims.aud !== configuration.clientId
      || idClaims.nonce !== pending.nonce
      || !validExpiry(idClaims.exp, now)) {
      throw new Error("Sign-in could not be verified.");
    }

    accessToken = tokens.access_token;
    return accessToken;
  }

  function clearSession() {
    accessToken = null;
    storage.removeItem(pendingAuthKey);
  }

  function signOut() {
    requireConfiguration();
    clearSession();
    const logout = new URL("/logout", configuration.authUrl);
    logout.search = new URLSearchParams({
      client_id: configuration.clientId,
      logout_uri: new URL("/", configuration.callbackUrl).href,
    });
    location.assign(logout.href);
  }

  return Object.freeze({
    configured,
    beginSignIn,
    completeSignIn,
    clearSession,
    getAccessToken: () => accessToken,
    signOut,
  });
}
