import { Command } from "commander";
import { getAuthFilePath, loadAuth } from "../lib/auth.js";
import { colors, printJson } from "../lib/format.js";

const BASE_URL = "https://sc-mentor.fly.dev/api";

type Source = "env" | "file" | null;

interface Resolved {
  key: string | null;
  source: Source;
  /** Human label for where the key came from. */
  sourceLabel: string | null;
}

/**
 * Resolve the API key and where it came from. Mirrors auth.getApiKey's
 * precedence (env var > auth file) but also reports the source so the user
 * — and the skill gate — can see which credential is in play.
 */
function resolveKey(): Resolved {
  const envKey = process.env.STATECHANGE_API_KEY;
  if (envKey) {
    return { key: envKey, source: "env", sourceLabel: "env (STATECHANGE_API_KEY)" };
  }
  const auth = loadAuth();
  if (auth?.apiKey) {
    return { key: auth.apiKey, source: "file", sourceLabel: `file (${getAuthFilePath()})` };
  }
  return { key: null, source: null, sourceLabel: null };
}

function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

interface LiveResult {
  /** Server returned 2xx for the key. */
  ok: boolean;
  /** HTTP status, or 0 when the server was unreachable. */
  status: number;
  /** True only when we actually got a response back from the server. */
  reachable: boolean;
}

/**
 * Confirm the key actually works against the live server. Hits /mcp-tools —
 * the cheapest authenticated endpoint (lists skills, no embedding/DB work
 * beyond key validation). 200 = valid, 401/403 = rejected, network error =
 * unreachable (inconclusive, not a hard failure).
 */
async function validateLive(key: string): Promise<LiveResult> {
  try {
    const res = await fetch(`${BASE_URL}/mcp-tools`, {
      headers: { "X-API-Key": key },
    });
    return { ok: res.ok, status: res.status, reachable: true };
  } catch {
    return { ok: false, status: 0, reachable: false };
  }
}

export const whoamiCommand = new Command("whoami")
  .alias("status")
  .description("Show authentication status (key source + live server check)")
  .option("--offline", "Only check for a local key; skip the server round-trip")
  .option("--json", "Output machine-readable JSON (for scripts / skill gates)")
  .action(async (options: { offline?: boolean; json?: boolean }) => {
    const { key, source, sourceLabel } = resolveKey();

    // --- No key anywhere ---
    if (!key) {
      if (options.json) {
        printJson({
          authenticated: false,
          source: null,
          reason: "no_key",
          server_checked: false,
          message: "No API key found. Run `mentor login`.",
        });
      } else {
        console.log(colors.error("Not signed in."));
        console.log(colors.dim("  No API key in $STATECHANGE_API_KEY or " + getAuthFilePath()));
        console.log("  Run " + colors.bold("mentor login") + " to authenticate.");
      }
      process.exit(1);
    }

    const masked = maskKey(key);

    // --- Local-only check (no network). The portable skill-gate primitive. ---
    if (options.offline) {
      if (options.json) {
        printJson({
          authenticated: true,
          source,
          key_masked: masked,
          server_checked: false,
        });
      } else {
        console.log(colors.bold("Signed in") + colors.dim(" (local key present; server not checked)"));
        console.log(colors.dim(`  source: ${sourceLabel}`));
        console.log(colors.dim(`  key:    ${masked}`));
      }
      return;
    }

    // --- Default: validate the key against the live server. ---
    const live = await validateLive(key);

    // Reachable + rejected → the key is bad (expired/revoked). Hard failure.
    if (live.reachable && !live.ok && (live.status === 401 || live.status === 403)) {
      if (options.json) {
        printJson({
          authenticated: false,
          source,
          key_masked: masked,
          reason: "rejected",
          server_checked: true,
          status: live.status,
          message: "Server rejected the key (expired or revoked). Run `mentor login`.",
        });
      } else {
        console.log(colors.error("Key rejected by server (expired or revoked)."));
        console.log(colors.dim(`  source: ${sourceLabel}`));
        console.log("  Run " + colors.bold("mentor login") + " to re-authenticate.");
      }
      process.exit(1);
    }

    // Reachable + 2xx → fully validated.
    if (live.ok) {
      if (options.json) {
        printJson({
          authenticated: true,
          source,
          key_masked: masked,
          server_checked: true,
          server_validated: true,
        });
      } else {
        console.log(colors.bold("Signed in") + colors.dim(" — validated against server"));
        console.log(colors.dim(`  source: ${sourceLabel}`));
        console.log(colors.dim(`  key:    ${masked}`));
      }
      return;
    }

    // Unreachable, or an unexpected status → key is present but we couldn't
    // confirm it. Not a hard failure: a network blip shouldn't read as
    // logged-out. Report the ambiguity honestly.
    if (options.json) {
      printJson({
        authenticated: true,
        source,
        key_masked: masked,
        server_checked: true,
        server_validated: false,
        server_reachable: live.reachable,
        status: live.status || null,
        message: live.reachable
          ? `Key present; server returned ${live.status} (could not confirm).`
          : "Key present; server unreachable (could not confirm).",
      });
    } else {
      console.log(colors.bold("Signed in") + colors.dim(" (key present; server check inconclusive)"));
      console.log(colors.dim(`  source: ${sourceLabel}`));
      console.log(colors.dim(`  key:    ${masked}`));
      console.log(
        colors.dim(
          live.reachable
            ? `  note:   server returned ${live.status}; couldn't confirm the key`
            : "  note:   couldn't reach the server to confirm the key",
        ),
      );
    }
  });
