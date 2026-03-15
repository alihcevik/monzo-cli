import { loadConfig, updateConfig } from "../config/store.js";
import { fetchAccounts } from "../api/accounts.js";
import { MonzoConfigError } from "../utils/errors.js";

export async function resolveAccountId(explicit?: string): Promise<string> {
  if (explicit) return explicit;

  const config = loadConfig();
  if (config.account_id) return config.account_id;

  // Try to auto-select if there's only one active account
  const { accounts } = await fetchAccounts();
  const active = accounts.filter((a) => !a.closed);

  if (active.length === 0) {
    throw new MonzoConfigError("No accounts found.");
  }

  if (active.length === 1) {
    updateConfig({ account_id: active[0].id });
    return active[0].id;
  }

  throw new MonzoConfigError(
    "Multiple accounts found. Use -a <account_id> or run `monzo accounts` to see them.",
  );
}
