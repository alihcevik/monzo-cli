import { Command } from "commander";
import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";
import { whoamiCommand } from "./commands/whoami.js";
import { accountsCommand } from "./commands/accounts.js";
import { balanceCommand } from "./commands/balance.js";
import { transactionsCommand } from "./commands/transactions.js";
import { syncCommand } from "./commands/sync.js";
import { MonzoAuthError, MonzoApiError, MonzoConfigError } from "./utils/errors.js";

const program = new Command();

program
  .name("monzo")
  .description("CLI for the Monzo banking API\n\nRun monzo <command> --help for details on each command.")
  .version("0.1.0");

program.addCommand(loginCommand);
program.addCommand(logoutCommand);
program.addCommand(whoamiCommand);
program.addCommand(accountsCommand);
program.addCommand(balanceCommand);
program.addCommand(transactionsCommand);
program.addCommand(syncCommand);

program.parseAsync().catch((err: unknown) => {
  if (err instanceof MonzoAuthError) {
    console.error(`Auth error: ${err.message}`);
    process.exitCode = 1;
  } else if (err instanceof MonzoApiError) {
    console.error(`API error: ${err.message}`);
    process.exitCode = 1;
  } else if (err instanceof MonzoConfigError) {
    console.error(`Config error: ${err.message}`);
    process.exitCode = 1;
  } else if (err instanceof Error) {
    console.error(`Error: ${err.message}`);
    process.exitCode = 1;
  } else {
    console.error("An unexpected error occurred.");
    process.exitCode = 1;
  }
});
