import { randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { startCallbackServer } from "./callback-server.js";
import { storeTokens } from "./token.js";
import { ensureSetup } from "./setup.js";
import { MonzoAuthError } from "../utils/errors.js";
import type { TokenResponse } from "../api/types.js";

const MONZO_AUTH_URL = "https://auth.monzo.com";
const MONZO_TOKEN_URL = "https://api.monzo.com/oauth2/token";

function isLocalhost(uri: string): boolean {
  try {
    const url = new URL(uri);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function openBrowser(url: string): void {
  const cmd = process.platform === "darwin" ? "open" : "xdg-open";
  execFile(cmd, [url], (err) => {
    if (err) {
      console.log(`\nCouldn't open browser automatically. Open this URL:\n${url}`);
    }
  });
}

async function exchangeCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(MONZO_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new MonzoAuthError(`Token exchange failed (${res.status}): ${text}`);
  }

  return (await res.json()) as TokenResponse;
}

export interface InlineCredentials {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}

export async function login(remote: boolean, reset = false, inline?: InlineCredentials): Promise<void> {
  const config = await ensureSetup(reset, inline);
  const { client_id, client_secret, redirect_uri } = config;

  if (!client_id || !client_secret || !redirect_uri) {
    throw new MonzoAuthError("Missing client credentials. Run setup again.");
  }

  const state = randomBytes(16).toString("hex");
  const useLocal = !remote && isLocalhost(redirect_uri);

  const authUrl = new URL(MONZO_AUTH_URL);
  authUrl.searchParams.set("client_id", client_id);
  authUrl.searchParams.set("redirect_uri", redirect_uri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);

  let code: string;

  if (useLocal) {
    const url = new URL(redirect_uri);
    const port = parseInt(url.port || "7272", 10);

    const serverPromise = startCallbackServer(port, state);

    console.log("Opening Monzo login in your browser...");
    openBrowser(authUrl.toString());
    console.log("Waiting for authorization...\n");

    const result = await serverPromise;
    code = result.code;
  } else {
    // Remote mode: print URL, user pastes code
    console.log("Open this URL in your browser:\n");
    console.log(authUrl.toString());
    console.log("\nAfter authorizing, you'll get an authorization code.");

    const rl = createInterface({ input: stdin, output: stdout });
    try {
      code = (await rl.question("\nPaste the authorization code: ")).trim();
    } finally {
      rl.close();
    }

    if (!code) {
      throw new MonzoAuthError("No authorization code provided.");
    }
  }

  const token = await exchangeCode(code, client_id, client_secret, redirect_uri);
  storeTokens(token);

  console.log("\nLogged in successfully!");
  console.log("Most likely, you will need to approve this login in your Monzo app. Check your app for a notification and approve it.");
}
