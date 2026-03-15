import { Command } from "commander";
import { fetchTransactions } from "../api/transactions.js";
import { resolveAccountId } from "./shared.js";
import {
  loadTransactionStore,
  saveTransactionStore,
  mergeTransactions,
} from "../config/transaction-store.js";

const PAGE_SIZE = 100;

export const syncCommand = new Command("sync")
  .description("Sync transactions to local storage for offline access")
  .option("-a, --account <id>", "Account ID")
  .option("--full", "Full sync from the beginning (ignore last sync point)")
  .action(async (opts: { account?: string; full?: boolean }) => {
    const accountId = await resolveAccountId(opts.account);
    const store = loadTransactionStore();

    // Determine start point for incremental sync
    let since: string | undefined;
    if (!opts.full && store.last_synced && store.account_id === accountId) {
      since = store.last_synced;
      console.log(`Incremental sync from ${since}...`);
    } else {
      console.log("Full sync — this may take a moment...");
    }

    let allNew: Awaited<ReturnType<typeof fetchTransactions>>["transactions"] = [];
    let before: string | undefined;
    let page = 0;

    // Paginate through all available transactions
    while (true) {
      page++;
      process.stdout.write(`  Fetching page ${page}...`);

      const { transactions } = await fetchTransactions({
        accountId,
        since,
        before,
        limit: PAGE_SIZE,
      });

      console.log(` ${transactions.length} transactions`);
      allNew.push(...transactions);

      if (transactions.length < PAGE_SIZE) break;

      // Next page: fetch transactions created before the oldest in this batch
      before = transactions[transactions.length - 1].created;
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

    const newest = merged[0]?.created;

    saveTransactionStore({
      last_synced: newest,
      account_id: accountId,
      transactions: merged,
    });

    console.log(
      `\nSynced ${allNew.length} new transactions (${merged.length} total stored).`,
    );
  });
