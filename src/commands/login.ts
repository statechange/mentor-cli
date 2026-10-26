import { Command } from "commander";
import open from "open";
import { loadAuth, saveAuth, getAuthFilePath } from "../lib/auth.js";
import { API_KEYS_URL } from "../lib/urls.js";
import { colors } from "../lib/format.js";

export const loginCommand = new Command("login")
  .description("Authenticate with an API key from SC Mentor")
  .option("--token <token>", "Save an API key from the Mentor key page")
  .action(async (options: { token?: string }) => {
    if (options.token) {
      saveAuth({ apiKey: options.token });
      console.log(colors.bold("API key saved."));
      console.log(colors.dim(`  Saved to ${getAuthFilePath()}`));
      console.log("Run `mentor whoami` to validate it against the server.");
      return;
    }

    if (loadAuth()) {
      console.log("An API key is already saved. Run `mentor whoami` to check it.");
      console.log("Use `mentor login --token <your-api-key>` to replace it.");
      return;
    }

    console.log("Sign in to Mentor and create an API key:");
    console.log(`  ${API_KEYS_URL}`);
    console.log("");
    console.log("Then save the key in your terminal:");
    console.log("  mentor login --token <your-api-key>");
    console.log("  mentor whoami");
    console.log("");
    console.log("Login completes after you save the key. Keep your API key private.");

    if (process.stdout.isTTY) {
      try {
        await open(API_KEYS_URL);
      } catch {
        console.log("Open the link above in your browser to continue.");
      }
    }
  });
