import { Command } from "commander";
import { clearTokens, loadConfig, purgeAll } from "../config/store.js";

export const logoutCommand = new Command("logout")
  .description("Clear stored authentication tokens")
  .option("--purge", "Delete all config, tokens, and local transaction data")
  .action(async (opts: { purge?: boolean }) => {
    if (opts.purge) {
      purgeAll();
      console.log("All monzo-cli data deleted.");
      return;
    }

    const config = loadConfig();
    if (!config.access_token) {
      console.log("Not currently logged in.");
      return;
    }

    // Try to invalidate on Monzo's side (best effort)
    try {
      await fetch("https://api.monzo.com/oauth2/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.access_token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
    } catch {
      // Ignore — we clear tokens locally either way
    }

    clearTokens();
    console.log("Logged out.");
  });
