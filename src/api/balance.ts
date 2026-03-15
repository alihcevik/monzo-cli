import { monzoGet } from "./client.js";
import type { Balance } from "./types.js";

export async function fetchBalance(accountId: string): Promise<Balance> {
  return monzoGet<Balance>("/balance", { account_id: accountId });
}
