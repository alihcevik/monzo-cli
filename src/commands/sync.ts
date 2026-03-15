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
    let page = 0;

    // Paginate forward through all available transactions
    // Monzo returns oldest-first, so we advance `since` to the last ID each page
    while (true) {
      page++;
      process.stdout.write(`  Fetching page ${page}...`);

      const { transactions } = await fetchTransactions({
        accountId,
        since,
        limit: PAGE_SIZE,
      });

      console.log(` ${transactions.length} transactions`);
      allNew.push(...transactions);

      if (transactions.length < PAGE_SIZE) break;

      // Use the last transaction's ID as cursor for the next page
      since = transactions[transactions.length - 1].id;
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
