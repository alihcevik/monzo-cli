import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { loadConfig, updateConfig, type Config } from "../config/store.js";
import { MonzoConfigError } from "../utils/errors.js";

async function prompt(rl: ReturnType<typeof createInterface>, question: string, existing?: string): Promise<string> {
  const suffix = existing ? ` [${existing}]` : "";
  const answer = (await rl.question(`${question}${suffix}: `)).trim();
  return answer || existing || "";
}

interface InlineCredentials {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}

export async function ensureSetup(forceReset = false, inline?: InlineCredentials): Promise<Config> {
  const config = loadConfig();

  // If all credentials provided inline, save and return immediately
  if (inline?.clientId && inline?.clientSecret) {
    return updateConfig({
      client_id: inline.clientId,
      client_secret: inline.clientSecret,
      redirect_uri: inline.redirectUri || "http://localhost:7272/callback",
    });
  }

  if (!forceReset && config.client_id && config.client_secret && config.redirect_uri) {
    return config;
  }

  console.log("First-time setup\n");
  console.log("1. Go to https://developers.monzo.com/ and sign in");
  console.log("2. Click \"Clients\" then \"New OAuth Client\"");
  console.log("3. Fill in the form:");
  console.log("   - Name:          anything (e.g. \"My CLI\")");
  console.log("   - Logo URL:      leave blank");
  console.log("   - Redirect URLs: http://localhost:7272/callback");
  console.log("   - Description:   leave blank");
  console.log("   - Confidentiality: select \"Confidential\"");
  console.log("4. You may need to approve the client in your Monzo app.");
  console.log("   If the client doesn't show up, check for a notification in the app.");
  console.log("5. Copy the Client ID and Client Secret below.\n");

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const client_id = await prompt(rl, "Client ID", config.client_id);
    const client_secret = await prompt(rl, "Client secret", config.client_secret);
    const redirect_uri = await prompt(rl, "Redirect URI", config.redirect_uri || "http://localhost:7272/callback");

    if (!client_id || !client_secret || !redirect_uri) {
      throw new MonzoConfigError("All fields are required.");
    }

    return updateConfig({ client_id, client_secret, redirect_uri });
  } finally {
    rl.close();
  }
}
