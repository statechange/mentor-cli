# @statechange/mentor

State Change's 25 years of building experience, right in your terminal. Search the knowledge base, explore mental models, and chat with SC Mentor — without leaving your flow.

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

### Chat interactively

```bash
mentor chat
```

Opens a conversational session with SC Mentor. Ask follow-up questions, explore ideas, and get advice — all streamed to your terminal. `Ctrl+C` to exit.

### Look up mental models

List all available models:

```bash
mentor model
```

View a specific model:

```bash
mentor model "Jobs to Be Done"
```

### Browse resources

List resources:

```bash
mentor resources
```

View a specific resource:

```bash
mentor resource <id>
```

### JSON output

All read commands support `--json` for piping to other tools:

```bash
mentor search "pricing" --json | jq '.results[0]'
mentor model "JTBD" --json
mentor resources --json
```

## Environment Variables

| Variable | Description |
|---|---|
| `STATECHANGE_API_KEY` | API key (overrides stored auth) |
| `NO_COLOR` | Disable colored output |
