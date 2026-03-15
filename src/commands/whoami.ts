import { Command } from "commander";
import { monzoGet } from "../api/client.js";
import type { WhoAmIResponse } from "../api/types.js";

export const whoamiCommand = new Command("whoami")
  .description("Show the currently authenticated user")
  .action(async () => {
    const data = await monzoGet<WhoAmIResponse>("/ping/whoami");

    if (!data.authenticated) {
      console.log("Not authenticated. Run `monzo login`.");
      process.exitCode = 1;
      return;
    }

    console.log(`User ID:   ${data.user_id}`);
    console.log(`Client ID: ${data.client_id}`);
  });
