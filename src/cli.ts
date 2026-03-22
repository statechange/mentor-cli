#!/usr/bin/env node

import { Command } from "commander";
import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";
import { searchCommand } from "./commands/search.js";
import { modelCommand } from "./commands/model.js";
import { resourcesCommand, resourceCommand } from "./commands/resources.js";
import { historyCommand } from "./commands/history.js";
import { contextCommand } from "./commands/context.js";

const program = new Command();

program
  .name("mentor")
  .description("SC Mentor — State Change knowledge base in your terminal")
  .version("0.1.0");

program.addCommand(loginCommand);
program.addCommand(logoutCommand);
program.addCommand(searchCommand);
program.addCommand(modelCommand);
program.addCommand(resourcesCommand);
program.addCommand(resourceCommand);
program.addCommand(historyCommand);
program.addCommand(contextCommand);

program.parse();
