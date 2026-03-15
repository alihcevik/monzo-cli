import { Command } from "commander";
import { fetchBalance } from "../api/balance.js";
import { resolveAccountId } from "./shared.js";
import { formatCurrency } from "../utils/format.js";

export const balanceCommand = new Command("balance")
  .description("Show account balance")
  .option("-a, --account <id>", "Account ID")
  .action(async (opts: { account?: string }) => {
    const accountId = await resolveAccountId(opts.account);
    const bal = await fetchBalance(accountId);

    console.log(`Balance:     ${formatCurrency(bal.balance, bal.currency)}`);
    console.log(`Total:       ${formatCurrency(bal.total_balance, bal.currency)}`);
    console.log(`Spent today: ${formatCurrency(bal.spend_today, bal.currency)}`);
  });
