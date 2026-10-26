import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const AUTH_DIR = path.join(os.homedir(), ".statechange");
const AUTH_FILE = path.join(AUTH_DIR, "auth.json");

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
  const updated = { ...loadAuth(), ...config };
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  const fd = fs.openSync(AUTH_FILE, "w", 0o600);
  try {
    fs.fchmodSync(fd, 0o600);
    fs.writeFileSync(fd, JSON.stringify(updated, null, 2));
  } finally {
    fs.closeSync(fd);
  }
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
