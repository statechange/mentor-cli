# SC Mentor CLI — Initial Plan

## Job to Be Done

A developer or entrepreneur is working in their terminal — coding, debugging, making decisions. They hit a moment where they need to think through a problem: pricing, architecture, build vs buy, how to handle a tricky client situation. They want to tap into State Change's 25 years of building experience without leaving their flow.

Today they'd have to open a browser, navigate to sc-mentor.fly.dev, log in, and type their question. The CLI eliminates that friction: `mentor search "how to price my SaaS"` gives them answers in seconds, right where they're already working.

## What This Is

An npm package published as `@statechange/mentor` that wraps the SC Mentor REST API. It provides:

1. **Authentication via device flow** — no browser callback URL needed. Run `mentor login`, get a code, approve in browser, done. Token stored locally.
2. **Search** — `mentor search "query"` returns relevant resources and mental models.
3. **Interactive chat** — `mentor chat` opens a conversational session (like the web UI, but in the terminal).
4. **Mental model lookup** — `mentor model "Jobs to Be Done"` returns the full model detail.
5. **Resource browsing** — `mentor resources` lists resources, `mentor resource session-123` shows detail.

## Architecture

```
@statechange/mentor/
├── src/
│   ├── cli.ts              # Entry point, command routing (Commander.js)
│   ├── commands/
│   │   ├── login.ts         # Device flow auth
│   │   ├── logout.ts        # Clear stored token
│   │   ├── search.ts        # Search knowledge base
│   │   ├── chat.ts          # Interactive chat session
│   │   ├── model.ts         # Mental model lookup
│   │   └── resources.ts     # Browse/view resources
│   ├── lib/
│   │   ├── api.ts           # HTTP client (wraps fetch, handles auth headers)
│   │   ├── auth.ts          # Token storage, refresh, device flow
│   │   └── format.ts        # Terminal output formatting (markdown rendering, colors)
│   └── index.ts             # Programmatic API export (for use as a library)
├── package.json
├── tsconfig.json
├── CLAUDE.md
└── README.md
```

## Key Design Decisions

### Auth: Device Flow (RFC 8628)

The standard OAuth device authorization grant. The flow:

1. CLI calls `POST /api:mcp/oauth2/device/authorize` with `client_id` and `scope`
2. Server returns `device_code`, `user_code`, and `verification_uri`
3. CLI displays: "Go to https://auth.statechange.ai/device and enter code: ABCD-1234"
4. CLI polls `POST /api:mcp/oauth2/token` with `grant_type=urn:ietf:params:oauth:grant-type:device_code`
5. Once user approves, token is returned and stored in `~/.config/statechange/auth.json`

**Xano side requirement**: The device authorization grant needs to be implemented in Xano's OAuth2 API group. This is the main backend dependency.

**Fallback if device flow isn't ready**: Support `mentor login --token <paste>` where the user manually copies a token from the web UI's API Keys page. This works today with no backend changes.

### Interactive Chat

The `mentor chat` command should feel like a lightweight REPL:

```
$ mentor chat
SC Mentor — type your question, Ctrl+C to exit

You: How should I think about pricing for a developer tool?

Mentor: [searches knowledge base]

Direct answer here...

Relevant content:
  - [essay] Value Timing → /resources/essay-124
  - [session] Pricing Workshop → /resources/session-456

Mental models:
  - Jobs to Be Done → /models/mm-42

What stage are you at — do you have existing users paying, or is this pre-launch?

You: _
```

Use `readline` or `ink` for the interactive prompt. Stream responses if the API supports SSE (it does via `/api/chat`).

### Output Formatting

- Render markdown in the terminal using `marked-terminal` or similar
- Support `--json` flag on all commands for piping to other tools
- Color-code resource types (sessions=green, essays=blue, etc.) matching the web UI
- Respect `NO_COLOR` env var

### Package Structure

- Published as `@statechange/mentor` on npm
- Binary name: `mentor` (via package.json `bin` field)
- Also usable as `npx @statechange/mentor search "query"` without installing
- Exports a programmatic API for use in scripts: `import { search } from '@statechange/mentor'`

## API Endpoints Used

All requests go to `https://sc-mentor.fly.dev/api/` with `Authorization: Bearer <token>` or `X-API-Key: <key>`.

| Command | Endpoint | Method |
|---------|----------|--------|
| search | `/api/retrieve` | POST |
| chat | `/api/chat` | POST (streaming) |
| model (list) | `/api/models` | GET |
| model (detail) | `/api/models/:id` | GET |
| resources (list) | `/api/resources` | GET |
| resource (detail) | `/api/resources/:id` | GET |

## Dependencies (Minimal)

- `commander` — CLI argument parsing
- `chalk` — Terminal colors
- `marked` + `marked-terminal` — Markdown rendering in terminal
- `conf` or raw fs — Token storage in `~/.config/statechange/`
- `open` — Open browser for device flow approval

No heavy frameworks. Keep the install fast so `npx` is viable.

## Implementation Order

1. **Scaffold** — package.json, tsconfig, bin entry point, basic Commander setup
2. **Auth** — `mentor login --token <paste>` (manual token), token storage, `mentor logout`
3. **Search** — `mentor search "query"` hitting `/api/retrieve`, formatted output
4. **Model** — `mentor model <id-or-name>`, `mentor models` for listing
5. **Resources** — `mentor resources`, `mentor resource <id>`
6. **Chat** — Interactive REPL with streaming responses
7. **Device flow auth** — Once Xano endpoint is ready, upgrade `mentor login`
8. **Polish** — Help text, error handling, `--json` flag, publish to npm

## Open Questions

- **Xano device flow**: Does the OAuth2 API group support device authorization grant today, or does it need to be built?
- **Rate limiting**: Should the CLI respect any rate limits? The web UI uses Gemini's rate limits indirectly.
- **Offline caching**: Should `mentor model` cache results locally for offline reference? Probably not in v1.
- **Chat history**: Should `mentor chat` support resuming conversations? Could use the same conversation ID system as the web UI.
