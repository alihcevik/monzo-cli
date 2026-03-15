import { monzoGet } from "./client.js";
import type { TransactionsResponse } from "./types.js";

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
