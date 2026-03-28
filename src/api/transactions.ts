import { monzoGet } from "./client.js";
import type { Transaction, TransactionsResponse } from "./types.js";

export interface FetchTransactionsOpts {
  accountId: string;
  since?: string;
  before?: string;
  limit?: number;
}

export async function fetchTransactions(
  opts: FetchTransactionsOpts,
): Promise<TransactionsResponse> {
  const params: Record<string, string> = {
    account_id: opts.accountId,
    "expand[]": "merchant",
  };
  if (opts.since) params.since = opts.since;
  if (opts.before) params.before = opts.before;
  if (opts.limit) params.limit = String(opts.limit);

  return monzoGet<TransactionsResponse>("/transactions", params);
}

const PAGE_SIZE = 100;

export async function fetchAllTransactions(
  opts: Omit<FetchTransactionsOpts, "limit">,
): Promise<Transaction[]> {
  const all: Transaction[] = [];
  let cursor: string | undefined = opts.since;

  while (true) {
    const params: Record<string, string> = {
      account_id: opts.accountId,
      "expand[]": "merchant",
      limit: String(PAGE_SIZE),
    };
    if (cursor) params.since = cursor;
    if (opts.before) params.before = opts.before;

    const data = await monzoGet<TransactionsResponse>("/transactions", params);
    const page = data.transactions;

    all.push(...page);

    if (page.length < PAGE_SIZE) break;

    cursor = page[page.length - 1].id;
  }

  return all;
}
