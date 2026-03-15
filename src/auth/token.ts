import { loadConfig, updateConfig, clearTokens } from "../config/store.js";
import { MonzoAuthError } from "../utils/errors.js";
import type { TokenResponse } from "../api/types.js";

const MONZO_TOKEN_URL = "https://api.monzo.com/oauth2/token";
const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

export function storeTokens(token: TokenResponse): void {
  updateConfig({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expires_at: Date.now() + token.expires_in * 1000,
  });
}

async function refreshAccessToken(): Promise<string> {
  const config = loadConfig();

  if (!config.refresh_token || !config.client_id || !config.client_secret) {
    clearTokens();
    throw new MonzoAuthError("No refresh token available. Please run `monzo login`.");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: config.client_id,
    client_secret: config.client_secret,
    refresh_token: config.refresh_token,
  });

  const res = await fetch(MONZO_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    clearTokens();
    throw new MonzoAuthError(
      `Token refresh failed (${res.status}). Please run \`monzo login\`.`,
    );
  }

  const data = (await res.json()) as TokenResponse;
  // Monzo rotates refresh tokens — always persist the new one
  storeTokens(data);
  return data.access_token;
}

export async function getValidToken(): Promise<string> {
  const config = loadConfig();

  if (!config.access_token) {
    throw new MonzoAuthError("Not logged in. Please run `monzo login`.");
  }

  const expiresAt = config.expires_at ?? 0;
  if (Date.now() + EXPIRY_BUFFER_MS < expiresAt) {
    return config.access_token;
  }

  // Token expired or expiring soon — refresh
  return refreshAccessToken();
}
