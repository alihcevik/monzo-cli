import { Command } from "commander";
import { fetchAllTransactions, fetchTransactions } from "../api/transactions.js";
import { resolveAccountId } from "./shared.js";
import { formatCurrency, formatDateTime, printTable } from "../utils/format.js";
import { MonzoApiError } from "../utils/errors.js";
import { loadTransactionStore } from "../config/transaction-store.js";
import type { Transaction } from "../api/types.js";

function filterLocal(
  transactions: Transaction[],
  opts: { since?: string; before?: string; limit: number },
): Transaction[] {
  let filtered = transactions;

  if (opts.since) {
    const sinceMs = new Date(opts.since).getTime();
    filtered = filtered.filter((t) => new Date(t.created).getTime() > sinceMs);
  }
  if (opts.before) {
    const beforeMs = new Date(opts.before).getTime();
    filtered = filtered.filter((t) => new Date(t.created).getTime() < beforeMs);
  }

  return filtered.slice(0, opts.limit);
}

function displayTransactions(txns: Transaction[]): void {
  if (txns.length === 0) {
    console.log("No transactions found.");
    return;
  }

  printTable(
    ["Date", "Description", "Amount", "Category"],
    txns.map((t) => [
      formatDateTime(t.created),
      t.merchant?.name ?? t.description,
      formatCurrency(t.amount, t.currency),
      t.category,
    ]),
  );
}

export const transactionsCommand = new Command("transactions")
  .description("List recent transactions")
  .option("-a, --account <id>", "Account ID")
  .option("--since <date>", "Show transactions after this date (e.g. 2025-01-01 or 2025-01-01T00:00:00Z)")
  .option("--before <date>", "Show transactions before this date (e.g. 2025-06-01)")
  .option("-n, --limit <n>", "Number of transactions to show", "20")
  .option("--local", "Read from local store only (offline, no API call)")
  .action(
    async (opts: {
      account?: string;
      since?: string;
      before?: string;
      limit: string;
      local?: boolean;
    }) => {
      const limit = parseInt(opts.limit, 10);

      if (opts.local) {
        const store = loadTransactionStore();
        const txns = filterLocal(store.transactions, {
          since: opts.since,
          before: opts.before,
          limit,
        });
        displayTransactions(txns);
        if (store.last_synced) {
          console.log(`\n(${store.transactions.length} transactions stored locally)`);
        }
        return;
      }

      const accountId = await resolveAccountId(opts.account);

      let txns: Transaction[];
      try {
        txns = await fetchAllTransactions({
          accountId,
          since: opts.since,
          before: opts.before,
        });
      } catch (err) {
        if (err instanceof MonzoApiError && err.status === 403) {
          console.error(
            "Access denied — Monzo restricts transaction history to 90 days after SCA.",
          );
          console.error(
            "Run `monzo sync` while you have access to save transactions locally,",
          );
          console.error(
            "then use `monzo transactions --local` to query saved data.",
          );
          process.exitCode = 1;
          return;
        }
        throw err;
      }

      displayTransactions(txns.slice(0, limit));
    },
  );
