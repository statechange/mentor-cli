# @statechange/mentor

State Change's 25 years of building experience, right in your terminal. Search the knowledge base, explore mental models, and browse resources — without leaving your flow.

## Install

```bash
npm install -g @statechange/mentor
```

Or run directly without installing:

```bash
npx @statechange/mentor search "how to price my SaaS"
```

## Getting Started

### Log in

```bash
mentor login
```

This shows the [Mentor API key page](https://mentor.statechange.ai/connect/keys)
and opens it in your browser when run interactively. Sign in, create a key, then
paste it into the command below to finish logging in:

```bash
mentor login --token <your-api-key>
mentor whoami
```

The saved key is validated by `mentor whoami` against `https://mentor.statechange.ai/api`.
Existing keys continue to work; login no longer uses Xano.

Your credentials are stored in `~/.statechange/auth.json` (shared with other State Change CLI tools).

### Check your status

```bash
mentor whoami        # or: mentor status
```

Reports whether you're signed in, where the key came from (`$STATECHANGE_API_KEY`
or `~/.statechange/auth.json`), and validates it against the live server. Exits
non-zero if you're not authenticated or the key was rejected.

```bash
mentor whoami --offline   # local key check only, no network — fully portable
mentor whoami --json      # machine-readable, for scripts and skill gates
```

### Log out

```bash
mentor logout
```

## Usage

### Search the knowledge base

```bash
mentor search "when should I raise prices"
mentor search "build vs buy"
```

Returns relevant resources and mental models. Add `--json` for machine-readable output.

### Look up mental models

List all available models:

```bash
mentor model
```

View a specific model by ID or number:

```bash
mentor model mm-70
mentor model 70
```

### Browse resources

List resources:

```bash
mentor resources
```

View a specific resource:

```bash
mentor resource essay-132
```

### JSON output

All commands support `--json` for piping to other tools:

```bash
mentor search "pricing" --json | jq '.resources[0]'
mentor model 70 --json
mentor resources --json
```

## Environment Variables

| Variable | Description |
|---|---|
| `STATECHANGE_API_KEY` | API key (overrides stored auth) |
| `NO_COLOR` | Disable colored output |
