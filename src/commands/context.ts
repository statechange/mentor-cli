import { Command } from "commander";
import { apiRequest } from "../lib/api.js";
import { renderMarkdown, colors, formatError, printJson } from "../lib/format.js";

interface ContextResponse {
  title: string | null;
  summary: string | null;
  message_count: number;
  detail: string;
  error?: string;
}

export const contextCommand = new Command("context")
  .description("Get a summary of a past conversation")
  .argument("<id>", "Conversation ID (from history command)")
  .option("--focus <topic>", "Focus the summary on a specific topic")
  .option("--json", "Output raw JSON")
  .action(async (id: string, options: { focus?: string; json?: boolean }) => {
    try {
      const body: Record<string, unknown> = { conversation_id: id };
      if (options.focus) body.focus = options.focus;

      const data = await apiRequest<ContextResponse>("/tools/get_chat_context", {
        method: "POST",
        body,
      });

      if (data.error) {
        formatError(data.error);
        process.exit(1);
      }

      if (options.json) {
        printJson(data);
        return;
      }

      if (data.title) {
        console.log(colors.bold(data.title));
      }
      if (data.summary) {
        console.log(colors.dim(data.summary));
      }
      if (data.message_count) {
        console.log(colors.dim(`${data.message_count} messages\n`));
      }

      if (data.detail) {
        console.log(renderMarkdown(data.detail));
      }
    } catch (err) {
      formatError((err as Error).message);
      process.exit(1);
    }
  });
