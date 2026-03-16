import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const AUTH_DIR = path.join(os.homedir(), ".statechange");
const AUTH_FILE = path.join(AUTH_DIR, "auth.json");

const SCKEYS_URL = "https://api.statechange.ai/api:sckeys";

interface AuthConfig {
  apiKey: string;
  authToken?: string;
  authTokenExpires?: number;
}

export function getAuthFilePath(): string {
  return AUTH_FILE;
}

export function loadAuth(): AuthConfig | null {
  try {
    const data = JSON.parse(fs.readFileSync(AUTH_FILE, "utf-8")) as AuthConfig;
    return data.apiKey ? data : null;
  } catch {
    return null;
  }
}

export function saveAuth(config: AuthConfig): void {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(AUTH_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export function clearAuth(): void {
  try {
    fs.unlinkSync(AUTH_FILE);
  } catch {
    // Already gone
  }
}

/**
 * Resolve API key from: CLI flag > env var > auth file
 */
export function getApiKey(options?: { apiKey?: string }): string | null {
  if (options?.apiKey) return options.apiKey;
  if (process.env.STATECHANGE_API_KEY) return process.env.STATECHANGE_API_KEY;
  const auth = loadAuth();
  return auth?.apiKey || null;
}

/**
 * Get API key or exit with an error message.
 */
export function requireApiKey(): string {
  const key = getApiKey();
  if (!key) {
    console.error("Not authenticated. Run `mentor login` first.");
    process.exit(1);
  }
  return key;
}

// --- Device Flow ---

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const res = await fetch(`${SCKEYS_URL}/device/code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to start login flow: ${res.status} ${text}`);
  }

  return res.json() as Promise<DeviceCodeResponse>;
}

export async function pollForToken(deviceCode: string, interval: number): Promise<string> {
  const pollMs = (interval || 5) * 1000;

  while (true) {
    await sleep(pollMs);

    const res = await fetch(`${SCKEYS_URL}/device/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_code: deviceCode }),
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error("Device code expired. Please try again.");
      }
      const text = await res.text();
      throw new Error(`Polling error: ${res.status} ${text}`);
    }

    const result = (await res.json()) as { status: string; api_key?: string };

    if (result.status === "complete" && result.api_key) {
      return result.api_key; // This is the auth token
    }

    // Still pending
    process.stdout.write(".");
  }
}

export async function createApiKey(authToken: string): Promise<string> {
  const res = await fetch(`${SCKEYS_URL}/keys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      name: "Mentor CLI (device flow)",
      description: `Created via mentor login on ${new Date().toISOString().split("T")[0]}`,
      type: "cli",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create API key: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { key: string };
  return data.key;
}
