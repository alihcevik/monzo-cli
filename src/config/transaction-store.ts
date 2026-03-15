import { existsSync, readFileSync, writeFileSync, renameSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { randomBytes } from "node:crypto";
import type { Transaction } from "../api/types.js";

interface TransactionStore {
  last_synced?: string; // ISO timestamp of most recent transaction
  account_id?: string;
  transactions: Transaction[];
}

function getStorePath(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  const base = xdg || join(homedir(), ".config");
  return join(base, "monzo-cli", "transactions.json");
}

export function loadTransactionStore(): TransactionStore {
  const path = getStorePath();
  if (!existsSync(path)) return { transactions: [] };
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as TransactionStore;
  } catch {
    return { transactions: [] };
  }
}

export function saveTransactionStore(store: TransactionStore): void {
  const path = getStorePath();
  const dir = join(path, "..");
  const tmp = join(dir, `.transactions-${randomBytes(4).toString("hex")}.tmp`);
  const data = JSON.stringify(store, null, 2) + "\n";

  writeFileSync(tmp, data, { mode: 0o600 });
  renameSync(tmp, path);
  chmodSync(path, 0o600);
}

export function mergeTransactions(
  existing: Transaction[],
  incoming: Transaction[],
): Transaction[] {
  const byId = new Map(existing.map((t) => [t.id, t]));

  for (const t of incoming) {
    byId.set(t.id, t); // Upsert — newer data wins
  }

  // Sort by created date descending (newest first)
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime(),
  );
}
