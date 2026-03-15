import { Command } from "commander";
import { fetchTransactions } from "../api/transactions.js";
import { resolveAccountId } from "./shared.js";
import {
  loadTransactionStore,
  saveTransactionStore,
  mergeTransactions,
} from "../config/transaction-store.js";
import { MonzoApiError } from "../utils/errors.js";
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

function generateHalfYearWindows(startYear: number, now: Date): { since: string; before: string; label: string }[] {
  const windows: { since: string; before: string; label: string }[] = [];
  const endYear = now.getFullYear();

  for (let year = startYear; year <= endYear; year++) {
    // First half: Jan 1 - Jul 1
    const h1Since = `${year}-01-01T00:00:00Z`;
    const h1Before = `${year}-07-01T00:00:00Z`;

    // Second half: Jul 1 - Jan 1 next year
    const h2Since = `${year}-07-01T00:00:00Z`;
    const h2Before = year === endYear ? now.toISOString() : `${year + 1}-01-01T00:00:00Z`;

    if (new Date(h1Since) < now) {
      windows.push({ since: h1Since, before: new Date(h1Before) < now ? h1Before : now.toISOString(), label: `${year} H1` });
    }
    if (new Date(h2Since) < now) {
      windows.push({ since: h2Since, before: new Date(h2Before) < now ? h2Before : now.toISOString(), label: `${year} H2` });
    }
  }

  return windows;
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
      // Full sync: chunk by 6 months to stay under Monzo's ~8760h range limit
      console.log("Full sync — this may take a moment...");

      const windows = generateHalfYearWindows(2015, new Date());

      for (const { since, before, label } of windows) {
        process.stdout.write(`  ${label}...`);
        try {
          const txns = await fetchAllInWindow(accountId, since, before);
          console.log(` ${txns.length} transactions`);
          allNew.push(...txns);
        } catch (err) {
          if (err instanceof MonzoApiError && err.status === 403) {
            console.log(` skipped (SCA restricted)`);
            continue;
          }
          throw err;
        }
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
