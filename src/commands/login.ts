import { Command } from "commander";
import { exec } from "node:child_process";
import {
  loadAuth,
  saveAuth,
  getAuthFilePath,
  requestDeviceCode,
  pollForToken,
  createApiKey,
} from "../lib/auth.js";
import { colors } from "../lib/format.js";

function openUrl(url: string): void {
  const cmd =
    process.platform === "darwin"
      ? `open "${url}"`
      : process.platform === "win32"
        ? `start "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

export const loginCommand = new Command("login")
  .description("Authenticate with SC Mentor")
  .option("--token <token>", "API key (skip device flow)")
  .action(async (options: { token?: string }) => {
    // Manual token mode
    if (options.token) {
      saveAuth({ apiKey: options.token });
      console.log(colors.bold("Authenticated successfully."));
      console.log(colors.dim(`  Saved to ${getAuthFilePath()}`));
      return;
    }

    // Check if already logged in
    const existing = loadAuth();
    if (existing) {
      console.log("Already authenticated. Run `mentor logout` first, or use --token to override.");
      return;
    }

    // Device flow
    try {
      const { device_code, user_code, verification_uri, interval } =
        await requestDeviceCode();

      const browserUrl = `${verification_uri}?code=${encodeURIComponent(user_code)}`;

      console.log("");
      console.log("  Opening browser to authenticate...");
      console.log("");
      console.log(`    ${browserUrl}`);
      console.log("");
      console.log(`  Code: ${colors.bold(user_code)}`);
      console.log("");

      openUrl(browserUrl);
      console.log(colors.dim("  (Browser opened automatically)"));
      console.log("");
      process.stdout.write("  Waiting for authorization...");

      const authToken = await pollForToken(device_code, interval);
      process.stdout.write(" done!\n");

      console.log("  Creating API key...");
      const apiKey = await createApiKey(authToken);

      saveAuth({ apiKey });
      console.log("");
      console.log(colors.bold(`  Authenticated! API key saved to ${getAuthFilePath()}`));
      console.log("");
      console.log("  You're all set! Try running:");
      console.log('    mentor search "how to price my SaaS"');
      console.log("");
    } catch (err) {
      console.error("");
      console.error(colors.error(`  ${(err as Error).message}`));
      console.error("  You can also authenticate manually:");
      console.error("    mentor login --token <your-api-key>");
      process.exit(1);
    }
  });
