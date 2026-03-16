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

This opens your browser to authenticate via State Change. Once you approve, you're all set.

If you prefer, you can paste an API key manually:

```bash
mentor login --token <your-api-key>
```

Your credentials are stored in `~/.statechange/auth.json` (shared with other State Change CLI tools).

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
