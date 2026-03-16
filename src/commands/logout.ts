import { Command } from "commander";
import { clearAuth } from "../lib/auth.js";
import { colors } from "../lib/format.js";

export const logoutCommand = new Command("logout")
  .description("Clear stored authentication token")
  .action(() => {
    clearAuth();
    console.log(colors.dim("Logged out."));
  });
