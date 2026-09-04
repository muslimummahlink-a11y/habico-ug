import type { QboTokenPayload, QboCompanyInfo } from "./types";

const QBO_API_BASE = "https://quickbooks.api.intuit.com/v3/company";
const QBO_OAUTH_BASE = "https://accounts.platform.intuit.com/oauth2/v1";

function getClientConfig() {
  const clientId = process.env.QBO_CLIENT_ID;
  const clientSecret = process.env.QBO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing QBO_CLIENT_ID or QBO_CLIENT_SECRET environment variables");
  }
  return { clientId, clientSecret };
}

function getRedirectUri() {
  const url = process.env.VITE_APP_URL || "https://www.habico.ug";
  return `${url}/qbo-callback`;
}

function basicAuth() {
  const { clientId, clientSecret } = getClientConfig();
  return btoa(`${clientId}:${clientSecret}`);
}

export function getQboAuthUrl(state: string): string {
  const { clientId } = getClientConfig();
  const redirectUri = getRedirectUri();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: "com.intuit.quickbooks.accounting",
    redirect_uri: redirectUri,
    state,
  });
  return `https://appcenter.intuit.com/connect/oauth2?${params}`;
}

export async function exchangeCodeForTokens(code: string, realmId: string): Promise<QboTokenPayload> {
  const redirectUri = getRedirectUri();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch(`${QBO_OAUTH_BASE}/tokens/bearer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth()}`,
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`QBO token exchange failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  return { ...data, realmId };
}

export async function refreshAccessToken(refreshToken: string): Promise<QboTokenPayload> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch(`${QBO_OAUTH_BASE}/tokens/bearer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth()}`,
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`QBO token refresh failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data;
}

export async function qboFetch<T>(
  realmId: string,
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${QBO_API_BASE}/${realmId}/${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`QBO API error: ${res.status} ${JSON.stringify(err)}`);
  }

  return res.json();
}

export async function qboQuery<T>(
  realmId: string,
  accessToken: string,
  query: string
): Promise<T> {
  const params = new URLSearchParams({ query });
  return qboFetch<T>(realmId, accessToken, `query?${params}`);
}

export async function getCompanyInfo(
  realmId: string,
  accessToken: string
): Promise<QboCompanyInfo> {
  return qboFetch<QboCompanyInfo>(realmId, accessToken, `companyinfo/${realmId}`);
}
