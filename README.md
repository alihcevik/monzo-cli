# monzo-cli

A command-line interface for the [Monzo](https://monzo.com) banking API. Check your balance, list transactions, and sync transaction history for offline access.

## Install

Requires Node.js 18+ and pnpm.

```bash
git clone https://github.com/alihcevik/monzo-cli.git
cd monzo-cli
pnpm install
pnpm link-cli
```

This builds the project and links `monzo` as a global command. If you update the source, run `pnpm link-cli` again.

To uninstall:

```bash
pnpm unlink --global
```

## Setup

You need a Monzo OAuth client to authenticate. Create one at https://developers.monzo.com/:

1. Sign in and click **Clients** → **New OAuth Client**
2. Fill in the form:
   - **Name**: anything (e.g. "My CLI")
   - **Logo URL**: leave blank
   - **Redirect URLs**: `http://localhost:7272/callback`
   - **Description**: leave blank
   - **Confidentiality**: select **Confidential**
3. You may need to approve the new client in your Monzo app — check for a notification.

Then log in using one of these methods:

```bash
# Interactive — prompts for credentials on first run
monzo login

# Inline — pass credentials directly (skips prompts)
monzo login --client-id oauth2client_xxx --client-secret mnzconf.xxx

# Headless — prints an auth URL, you paste the code back
monzo login --remote

# Re-enter credentials
monzo login --reset
```

After running `monzo login`, you'll need to approve the login in your Monzo app.

## Commands

| Command | Description |
|---|---|
| `monzo login` | Authenticate with Monzo |
| `monzo logout` | Clear stored tokens |
| `monzo whoami` | Show authenticated user |
| `monzo accounts` | List your accounts |
| `monzo balance` | Show account balance |
| `monzo transactions` | List recent transactions |
| `monzo sync` | Save transactions locally for offline access |

Run `monzo <command> --help` for details on each command.

### Examples

```bash
# Show balance
monzo balance

# Last 10 transactions
monzo transactions --limit 10

# Transactions in a date range
monzo transactions --since 2025-01-01 --before 2025-02-01

# Sync all transactions locally
monzo sync

# Full re-sync from the beginning
monzo sync --full

# View synced transactions offline
monzo transactions --local
```

## How it works

**Authentication**: Uses OAuth 2.0 authorization code flow. A local server on port 7272 captures the redirect. Tokens auto-refresh before expiry.

**Transactions**: Fetches all matching transactions using cursor-based pagination (100 per page). The `--limit` flag trims the result after fetching.

**Sync**: Downloads your full transaction history to `~/.config/monzo-cli/transactions.json`. Incremental by default — only fetches new transactions since the last sync. Use `--full` to re-sync everything (walks history in 6-month chunks to stay within Monzo's API range limit). Gracefully skips 403 errors for SCA-restricted date ranges.

**Local storage**: Config and tokens live in `~/.config/monzo-cli/config.json` (0600 permissions). Monzo restricts API access to transactions older than 90 days after SCA, so run `monzo sync` while you have access, then query offline with `monzo transactions --local`.

## License

MIT
