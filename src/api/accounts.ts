import { monzoGet } from "./client.js";
import type { AccountsResponse } from "./types.js";

export async function fetchAccounts(accountType?: string): Promise<AccountsResponse> {
  const params: Record<string, string> = {};
  if (accountType) {
    params.account_type = accountType;
  }
  return monzoGet<AccountsResponse>("/accounts", params);
}
