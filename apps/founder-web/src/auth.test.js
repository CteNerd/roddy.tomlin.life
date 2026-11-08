import { webcrypto } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { createAuthClient } from "./auth.js";
import { isFounderConfigurationValid } from "./config.js";

const configuration = {
  authUrl: "https://rct-founder.auth.us-east-1.amazoncognito.com",
  clientId: "public-browser-client",
  userPoolId: "us-east-1_example",
  apiUrl: "https://abc123.execute-api.us-east-1.amazonaws.com",
  callbackUrl: "https://example.com/founder/",
};

function createStorage() {
  const values = new Map();
  return {
    values,
    setItem: (key, value) => values.set(key, value),
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
  };
}

function encode(value) {
  return btoa(JSON.stringify(value)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function jwt(claims) {
  return `header.${encode(claims)}.signature`;
}

describe("Founder OAuth client", () => {
  it("uses authorization code with PKCE and keeps only short-lived verifier state in session storage", async () => {
    const storage = createStorage();
    const location = { assign: vi.fn() };
    const auth = createAuthClient(configuration, { cryptoApi: webcrypto, storage, location });

    await auth.beginSignIn();

    const authorization = new URL(location.assign.mock.calls[0][0]);
    const pending = JSON.parse(storage.values.get("rct-founder-pkce"));
    const digest = await webcrypto.subtle.digest("SHA-256", new TextEncoder().encode(pending.verifier));
    const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
    expect(authorization.origin).toBe(new URL(configuration.authUrl).origin);
    expect(authorization.pathname).toBe("/oauth2/authorize");
    expect(authorization.searchParams.get("response_type")).toBe("code");
    expect(authorization.searchParams.get("code_challenge_method")).toBe("S256");
    expect(authorization.searchParams.get("code_challenge")).toBe(challenge);
    expect(authorization.searchParams.get("state")).toBe(pending.state);
    expect(authorization.searchParams.get("nonce")).toBe(pending.nonce);
    expect(authorization.searchParams.get("redirect_uri")).toBe(configuration.callbackUrl);
    expect(pending).not.toHaveProperty("access_token");
  });

  it("verifies callback state, issuer, client, token use and nonce before keeping an access token in memory", async () => {
    const storage = createStorage();
    const history = { replaceState: vi.fn() };
    const now = Date.now();
    const issuer = "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_example";
    storage.setItem("rct-founder-pkce", JSON.stringify({
      verifier: "pkce-verifier",
      state: "expected-state",
      nonce: "expected-nonce",
    }));
    const fetchImpl = vi.fn(async (_url, request) => {
      const body = new URLSearchParams(request.body);
      expect(body.get("grant_type")).toBe("authorization_code");
      expect(body.get("code")).toBe("one-time-code");
      expect(body.get("code_verifier")).toBe("pkce-verifier");
      expect(body.get("redirect_uri")).toBe(configuration.callbackUrl);
      return {
        ok: true,
        json: async () => ({
          token_type: "Bearer",
          access_token: jwt({
            iss: issuer, token_use: "access", client_id: configuration.clientId,
            exp: Math.floor(now / 1000) + 3600,
          }),
          id_token: jwt({
            iss: issuer, aud: configuration.clientId, nonce: "expected-nonce",
            exp: Math.floor(now / 1000) + 3600,
          }),
        }),
      };
    });
    const auth = createAuthClient(configuration, {
      cryptoApi: webcrypto,
      storage,
      history,
      fetchImpl,
      now: () => now,
    });

    const accessToken = await auth.completeSignIn(
      "https://example.com/founder/?code=one-time-code&state=expected-state",
    );

    expect(accessToken).toMatch(/^header\./);
    expect(auth.getAccessToken()).toBe(accessToken);
    expect(storage.values.size).toBe(0);
    expect(history.replaceState).toHaveBeenCalledWith(null, "", "/founder/");

    auth.clearSession();
    expect(auth.getAccessToken()).toBeNull();
  });

  it("fails closed on state mismatch and invalid public configuration", async () => {
    const storage = createStorage();
    storage.setItem("rct-founder-pkce", JSON.stringify({
      verifier: "verifier", state: "expected", nonce: "nonce",
    }));
    const fetchImpl = vi.fn();
    const auth = createAuthClient(configuration, {
      cryptoApi: webcrypto,
      storage,
      fetchImpl,
      history: { replaceState: vi.fn() },
    });

    await expect(auth.completeSignIn(
      "https://example.com/founder/?code=one-time-code&state=wrong",
    )).rejects.toThrow("Sign-in could not be verified.");
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(storage.values.size).toBe(0);
    expect(isFounderConfigurationValid({ ...configuration, authUrl: "http://auth.example.com" })).toBe(false);
    expect(isFounderConfigurationValid({ ...configuration, callbackUrl: "https://example.com/auth/callback" })).toBe(false);
    expect(isFounderConfigurationValid({ ...configuration, apiUrl: "https://attacker.example" })).toBe(false);
  });

  it("rejects a callback issuer that does not match the configured pool", async () => {
    const storage = createStorage();
    storage.setItem("rct-founder-pkce", JSON.stringify({
      verifier: "verifier", state: "expected", nonce: "nonce",
    }));
    const fetchImpl = vi.fn();
    const auth = createAuthClient(configuration, {
      cryptoApi: webcrypto,
      storage,
      fetchImpl,
      history: { replaceState: vi.fn() },
    });

    await expect(auth.completeSignIn(
      "https://example.com/founder/?code=one-time-code&state=expected&iss=https%3A%2F%2Fattacker.example",
    )).rejects.toThrow("Sign-in could not be verified.");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
