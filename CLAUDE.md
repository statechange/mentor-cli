# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`@statechange/mentor` — a CLI tool that wraps the SC Mentor REST API, giving terminal access to State Change's knowledge base of mental models, essays, sessions, and resources. Published to npm with binary name `mentor`.

## Commands

- `npm run build` — compile TypeScript to `dist/`
- `npm run dev` — watch mode compilation
- `node dist/cli.js <command>` — run locally during development

No test suite yet.

## Architecture

ESM TypeScript project using Commander.js for CLI routing.

**Entry points:**
- `src/cli.ts` — CLI binary entry point, registers all commands
- `src/index.ts` — programmatic API exports (for library usage)

**Commands** (`src/commands/`): Each file exports a Commander `Command` instance. Commands: `login`, `logout`, `search`, `model`, `resources`/`resource`.

**Lib layer** (`src/lib/`):
- `api.ts` — single `apiRequest()` function wrapping fetch with `X-API-Key` auth header. All requests go to `https://sc-mentor.fly.dev/api/`.
- `auth.ts` — credential storage at `~/.statechange/auth.json` (shared with `sc-xano` CLI). Includes full OAuth device flow implementation against `api.statechange.ai/api:sckeys`. Priority: CLI flag → `STATECHANGE_API_KEY` env var → auth file.
- `format.ts` — terminal markdown rendering via `marked` + `marked-terminal`, chalk color helpers. Respects `NO_COLOR`.

## API Response Shapes

The API field names don't always match between list and detail endpoints:
- Models list: `label`, `description`, `category`, `resourceCount`
- Model detail: `label`, `description`, `coreInsight`, `mindsetShift`, `keyPractices`, `synthesizedContent`
- Resources list: `resourceType` (camelCase)
- Resource detail: `resource_type` (snake_case), `markdown`, `summary`, `transcript`, `connected_models` (with `model_id`/`model_label`)
- Search response: `resources` array + `models` array (not `results`/`answer`)

## Key Conventions

- Model IDs are `mm-<number>` — the CLI accepts bare numbers (e.g., `mentor model 70` → `mm-70`)
- All read commands support `--json` for machine-readable output
- `marked-terminal` must be instantiated with `new TerminalRenderer()` passed via `marked.setOptions({ renderer })`, not via the `Marked` constructor
