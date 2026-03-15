import { Command } from "commander";
import { fetchTransactions } from "../api/transactions.js";
import { resolveAccountId } from "./shared.js";
import {
  loadTransactionStore,
  saveTransactionStore,
  mergeTransactions,
} from "../config/transaction-store.js";
import type { Transaction } from "../api/types.js";

const PAGE_SIZE = 100;

async function fetchAllInWindow(
  accountId: string,
  since: string,
  before: string,
): Promise<Transaction[]> {
  let cursor: string = since;
  const results: Transaction[] = [];

  while (true) {
    const { transactions } = await fetchTransactions({
      accountId,
      since: cursor,
      before,
      limit: PAGE_SIZE,
    });

    results.push(...transactions);

    if (transactions.length < PAGE_SIZE) break;
    cursor = transactions[transactions.length - 1].id;
  }

  return results;
}

export const syncCommand = new Command("sync")
  .description("Sync transactions to local storage for offline access")
  .option("-a, --account <id>", "Account ID")
  .option("--full", "Full sync from the beginning (ignore last sync point)")
  .action(async (opts: { account?: string; full?: boolean }) => {
    const accountId = await resolveAccountId(opts.account);
    const store = loadTransactionStore();

    const isIncremental =
      !opts.full && store.last_synced && store.account_id === accountId;

    let allNew: Transaction[] = [];

    if (isIncremental) {
      // Incremental: single fetch from last cursor to now
      console.log(`Incremental sync...`);
      let cursor: string = store.last_synced!;

      while (true) {
        process.stdout.write(`  Fetching...`);
        const { transactions } = await fetchTransactions({
          accountId,
          since: cursor,
          limit: PAGE_SIZE,
        });
        console.log(` ${transactions.length} transactions`);
        allNew.push(...transactions);

        if (transactions.length < PAGE_SIZE) break;
        cursor = transactions[transactions.length - 1].id;
      }
    } else {
      // Full sync: chunk by year to avoid Monzo's ~1 year range limit
      console.log("Full sync — this may take a moment...");

      const startYear = 2015;
      const now = new Date();
      const endYear = now.getFullYear();

      for (let year = startYear; year <= endYear; year++) {
        const since = `${year}-01-01T00:00:00Z`;
        const before =
          year === endYear
            ? now.toISOString()
            : `${year + 1}-01-01T00:00:00Z`;

        process.stdout.write(`  ${year}...`);
        const txns = await fetchAllInWindow(accountId, since, before);
        console.log(` ${txns.length} transactions`);

        allNew.push(...txns);
      }
    }

    if (allNew.length === 0) {
      console.log("No new transactions found.");
      return;
    }

    // Merge with existing and save
    const merged = mergeTransactions(
      store.account_id === accountId ? store.transactions : [],
      allNew,
    );

    // Store the newest transaction's ID as cursor for next incremental sync
    const newestId = merged[0]?.id;

    saveTransactionStore({
      last_synced: newestId,
      account_id: accountId,
      transactions: merged,
    });

    console.log(
      `\nSynced ${allNew.length} new transactions (${merged.length} total stored).`,
    );
  });
