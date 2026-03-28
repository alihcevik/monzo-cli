import { Command } from "commander";
import { login } from "../auth/oauth.js";

export const loginCommand = new Command("login")
  .description("Authenticate with Monzo")
  .option("--client-id <id>", "Monzo OAuth client ID")
  .option("--client-secret <secret>", "Monzo OAuth client secret")
  .option("--redirect-uri <uri>", "OAuth redirect URI")
  .option("--remote", "Use remote/headless mode (paste code manually)")
  .option("--reset", "Re-enter client credentials before logging in")
  .action(async (opts: {
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
    remote?: boolean;
    reset?: boolean;
  }) => {
    await login(opts.remote ?? false, opts.reset ?? false, {
      clientId: opts.clientId,
      clientSecret: opts.clientSecret,
      redirectUri: opts.redirectUri,
    });
  });
