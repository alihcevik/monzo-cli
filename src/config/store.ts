import { existsSync, mkdirSync, renameSync, writeFileSync, readFileSync, chmodSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { randomBytes } from "node:crypto";
import { MonzoConfigError } from "../utils/errors.js";

export interface Config {
  client_id?: string;
  client_secret?: string;
  redirect_uri?: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number; // Unix timestamp in ms
  account_id?: string;
}

function getConfigDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  const base = xdg || join(homedir(), ".config");
  return join(base, "monzo-cli");
}

function getConfigPath(): string {
  return join(getConfigDir(), "config.json");
}

export function loadConfig(): Config {
  const path = getConfigPath();
  if (!existsSync(path)) return {};
  try {
    const raw = readFileSync(path, "utf-8");
    return JSON.parse(raw) as Config;
  } catch {
    throw new MonzoConfigError(`Failed to read config at ${path}`);
  }
}

export function saveConfig(config: Config): void {
  const dir = getConfigDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }

  const path = getConfigPath();
  const tmp = join(dir, `.config-${randomBytes(4).toString("hex")}.tmp`);
  const data = JSON.stringify(config, null, 2) + "\n";

  writeFileSync(tmp, data, { mode: 0o600 });
  renameSync(tmp, path);
  // Ensure perms even if file existed with different mode
  chmodSync(path, 0o600);
}

export function updateConfig(partial: Partial<Config>): Config {
  const config = { ...loadConfig(), ...partial };
  saveConfig(config);
  return config;
}

export function clearTokens(): void {
  const config = loadConfig();
  delete config.access_token;
  delete config.refresh_token;
  delete config.expires_at;
  saveConfig(config);
}

export function purgeAll(): void {
  const dir = getConfigDir();
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true });
  }
}
