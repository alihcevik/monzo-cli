import { Command } from "commander";
import { login } from "../auth/oauth.js";

export const loginCommand = new Command("login")
  .description("Authenticate with Monzo")
  .option("--remote", "Use remote/headless mode (paste code manually)")
  .option("--reset", "Re-enter client credentials before logging in")
  .action(async (opts: { remote?: boolean; reset?: boolean }) => {
    await login(opts.remote ?? false, opts.reset ?? false);
  });
