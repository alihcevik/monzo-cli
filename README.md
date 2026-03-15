# monzo-cli

A command-line interface for the [Monzo](https://monzo.com) banking API. Check your balance, list transactions, and sync transaction history for offline access.

## Install

Requires Node.js 18+ and pnpm.

```bash
git clone https://github.com/alihcevik/monzo-cli.git
cd monzo-cli
pnpm install
pnpm build
pnpm link --global  # makes `monzo` available globally
```

## Setup

1. Go to https://developers.monzo.com/ and sign in
2. Click **Clients** then **New OAuth Client**
3. Fill in the form:
   - **Name**: anything (e.g. "My CLI")
   - **Logo URL**: leave blank
   - **Redirect URLs**: `http://localhost:7272/callback`
   - **Description**: leave blank
   - **Confidentiality**: select **Confidential**
4. Run `monzo login` and paste your Client ID and Client Secret when prompted

On a headless server (no browser), use `monzo login --remote` — it will print an auth URL for you to open elsewhere, then you paste the code back.

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
# Log in (opens browser)
monzo login

# Log in on a remote server (paste code manually)
monzo login --remote

# Re-enter client credentials
monzo login --reset

# Show balance
monzo balance

# Last 10 transactions
monzo transactions --limit 10

# Transactions in a date range
monzo transactions --since 2025-01-01 --before 2025-02-01

# Sync all transactions locally
monzo sync

# View synced transactions offline
monzo transactions --local
```

## Token management

Tokens are stored in `~/.config/monzo-cli/config.json` with `0600` permissions. Access tokens are automatically refreshed when they expire — you shouldn't need to re-login unless you revoke access.

## Transaction sync

Monzo restricts API access to transactions older than 90 days after Strong Customer Authentication (SCA). Run `monzo sync` while you have full access to save your transaction history locally. After the 90-day window closes, use `monzo transactions --local` to query saved data.

## License

MIT
