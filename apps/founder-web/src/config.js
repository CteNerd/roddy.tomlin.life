const environment = import.meta.env;

export const founderConfiguration = Object.freeze({
  authUrl: environment.VITE_FOUNDER_AUTH_URL ?? "",
  clientId: environment.VITE_FOUNDER_CLIENT_ID ?? "",
  userPoolId: environment.VITE_FOUNDER_USER_POOL_ID ?? "",
  apiUrl: environment.VITE_FOUNDER_API_URL ?? "",
  callbackUrl: environment.VITE_FOUNDER_CALLBACK_URL ?? "",
});

export function isFounderConfigurationValid(configuration) {
  if (!configuration?.clientId || !configuration.userPoolId) return false;
  const pool = /^([a-z0-9-]+)_([A-Za-z0-9]+)$/.exec(configuration.userPoolId);
  if (!pool) return false;
  try {
    const auth = new URL(configuration.authUrl);
    const api = new URL(configuration.apiUrl);
    const callback = new URL(configuration.callbackUrl);
    const region = pool[1];
    const issuer = new URL(`https://cognito-idp.${region}.amazonaws.com/${configuration.userPoolId}`);
    const cognitoDomainSuffix = `.auth.${region}.amazoncognito.com`;
    const apiGatewaySuffix = `.execute-api.${region}.amazonaws.com`;
    const allowedApi = (api.protocol === "https:"
      && api.hostname.endsWith(apiGatewaySuffix)
      && api.hostname.length > apiGatewaySuffix.length)
      || (api.protocol === "http:" && ["localhost", "127.0.0.1"].includes(api.hostname));
    return auth.protocol === "https:"
      && auth.hostname.endsWith(cognitoDomainSuffix)
      && auth.hostname.length > cognitoDomainSuffix.length
      && auth.pathname === "/"
      && !auth.search
      && !auth.hash
      && !auth.username
      && !auth.password
      && issuer.protocol === "https:"
      && allowedApi
      && api.pathname === "/"
      && !api.username
      && !api.password
      && !api.search
      && !api.hash
      && ["https:", "http:"].includes(callback.protocol)
      && (callback.protocol !== "http:" || ["localhost", "127.0.0.1"].includes(callback.hostname))
      && callback.pathname === "/founder/"
      && !callback.username
      && !callback.password
      && !callback.search
      && !callback.hash;
  } catch {
    return false;
  }
}

export function founderIssuer(userPoolId) {
  const pool = /^([a-z0-9-]+)_[A-Za-z0-9]+$/.exec(userPoolId);
  if (!pool) throw new Error("Founder authentication configuration is invalid.");
  return `https://cognito-idp.${pool[1]}.amazonaws.com/${userPoolId}`;
}
