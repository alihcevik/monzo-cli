# AGENTS.md

## Cursor Cloud specific instructions

`monzo-cli` is a single TypeScript CLI package (no backend/frontend services). It is built with `tsup` and uses `pnpm` (see `packageManager` in `package.json`). Node 18+ is required; the cloud VM has Node 22, which works.

Standard commands live in `package.json` (`pnpm build`, `pnpm dev` for watch mode, `pnpm link-cli` to build + globally link). Type-check with `pnpm exec tsc --noEmit`. There is no lint or automated test suite configured.

Non-obvious notes:
- `pnpm link-cli` / `pnpm link --global` fail unless pnpm's global bin dir is configured (`ERR_PNPM_NO_GLOBAL_BIN_DIR`). For local development/testing you can skip linking and run the built CLI directly with `node dist/index.js <command>`.
- Config and tokens are stored under `$XDG_CONFIG_HOME/monzo-cli` (falling back to `~/.config/monzo-cli`). Set `XDG_CONFIG_HOME` to an isolated dir to sandbox runs.
- Live commands (`login`, `whoami`, `accounts`, `balance`, `transactions`, `sync`) require real Monzo OAuth credentials and a real Monzo account, so they cannot be fully exercised in the VM without user-provided secrets. The offline path is fully testable: seed `$XDG_CONFIG_HOME/monzo-cli/transactions.json` and run `node dist/index.js transactions --local` to exercise the store + formatting/table-rendering code without network/auth.
