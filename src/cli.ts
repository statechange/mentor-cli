#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Command } from "commander";
import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";
import { searchCommand } from "./commands/search.js";
import { modelCommand, modelsCommand } from "./commands/model.js";
import { resourcesCommand, resourceCommand } from "./commands/resources.js";
import { historyCommand } from "./commands/history.js";
import { contextCommand } from "./commands/context.js";
import { compareCommand } from "./commands/compare.js";
import { sharpenCommand } from "./commands/sharpen.js";

const pkgPath = resolve(dirname(fileURLToPath(import.meta.url)), "../package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version: string };

const program = new Command();

program
  .name("mentor")
  .description("SC Mentor — State Change knowledge base in your terminal")
  .version(pkg.version);

program.addCommand(loginCommand);
program.addCommand(logoutCommand);
program.addCommand(searchCommand);
program.addCommand(modelCommand);
program.addCommand(modelsCommand);
program.addCommand(resourcesCommand);
program.addCommand(resourceCommand);
program.addCommand(historyCommand);
program.addCommand(contextCommand);
program.addCommand(compareCommand);
program.addCommand(sharpenCommand);

program.parse();
