import { Command } from "commander";
import { apiRequest } from "../lib/api.js";
import { colors, formatError, printJson } from "../lib/format.js";

interface ConversationHit {
  id: string;
  title: string;
  summary: string | null;
  message_count: number;
  last_active: string;
}

interface HistoryResponse {
  conversations: ConversationHit[];
}

function printConversations(convos: ConversationHit[]) {
  if (!convos.length) {
    console.log(colors.dim("No conversations found."));
    return;
  }
  for (const c of convos) {
    const date = new Date(c.last_active).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    console.log(`  ${colors.bold(c.title || "Untitled")}  ${colors.dim(`${c.message_count} msgs · ${date}`)}`);
    if (c.summary) {
      console.log(`    ${colors.dim(c.summary)}`);
    }
    console.log(`    ${colors.dim(`id: ${c.id}`)}`);
    console.log();
  }
}

export const historyCommand = new Command("history")
  .description("List or search your mentor conversations")
  .option("--limit <n>", "Max results", "20")
  .option("--offset <n>", "Offset for pagination", "0")
  .option("--json", "Output raw JSON")
  .action(async (options: { limit?: string; offset?: string; json?: boolean }) => {
    try {
      const data = await apiRequest<HistoryResponse>("/tools/list_chat_history", {
        method: "POST",
        body: {
          limit: parseInt(options.limit || "20"),
          offset: parseInt(options.offset || "0"),
        },
      });

      if (options.json) {
        printJson(data);
        return;
      }

      printConversations(data.conversations || []);
    } catch (err) {
      formatError((err as Error).message);
      process.exit(1);
    }
  });

const searchSubcommand = new Command("search")
  .description("Search conversations by keyword")
  .argument("<query>", "Keywords or topic to search for")
  .option("--limit <n>", "Max results", "5")
  .option("--json", "Output raw JSON")
  .action(async (query: string, options: { limit?: string; json?: boolean }) => {
    try {
      const data = await apiRequest<HistoryResponse>("/tools/search_chat_history", {
        method: "POST",
        body: { query, limit: parseInt(options.limit || "5") },
      });

      if (options.json) {
        printJson(data);
        return;
      }

      const convos = data.conversations || [];
      if (!convos.length) {
        console.log(colors.dim("No matching conversations found."));
        return;
      }

      console.log(colors.bold(`Found ${convos.length} conversation${convos.length === 1 ? "" : "s"}:\n`));
      printConversations(convos);
    } catch (err) {
      formatError((err as Error).message);
      process.exit(1);
    }
  });

historyCommand.addCommand(searchSubcommand);
