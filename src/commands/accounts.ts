import { Command } from "commander";
import { fetchAccounts } from "../api/accounts.js";
import { updateConfig, loadConfig } from "../config/store.js";
import { printTable } from "../utils/format.js";

export const accountsCommand = new Command("accounts")
  .description("List your Monzo accounts")
  .option("--type <type>", "Filter by account type (e.g. uk_retail)")
  .action(async (opts: { type?: string }) => {
    const { accounts } = await fetchAccounts(opts.type);
    const active = accounts.filter((a) => !a.closed);

    if (active.length === 0) {
      console.log("No accounts found.");
      return;
    }

    printTable(
      ["ID", "Type", "Description", "Currency"],
      active.map((a) => [
        a.id,
        a.type,
        a.description,
        a.currency,
      ]),
    );

    // Auto-save default account if there's only one
    const config = loadConfig();
    if (!config.account_id && active.length === 1) {
      updateConfig({ account_id: active[0].id });
      console.log(`\nDefault account set to ${active[0].id}`);
    }
  });
