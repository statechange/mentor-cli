import { Command } from "commander";
import { apiRequest } from "../lib/api.js";
import { renderMarkdown, colors, formatError, printJson } from "../lib/format.js";

interface SearchResult {
  content: string;
  metadata?: {
    type?: string;
    title?: string;
    id?: string;
  };
  score?: number;
}

interface SearchResponse {
  results: SearchResult[];
  answer?: string;
}

export const searchCommand = new Command("search")
  .description("Search the SC Mentor knowledge base")
  .argument("<query>", "Search query")
  .option("--json", "Output raw JSON")
  .action(async (query: string, options: { json?: boolean }) => {
    try {
      const data = await apiRequest<SearchResponse>("/retrieve", {
        method: "POST",
        body: { query },
      });

      if (options.json) {
        printJson(data);
        return;
      }

      if (data.answer) {
        console.log(renderMarkdown(data.answer));
        console.log();
      }

      if (data.results?.length) {
        console.log(colors.bold("Relevant resources:"));
        for (const result of data.results) {
          const type = result.metadata?.type || "resource";
          const title = result.metadata?.title || "Untitled";
          const colorFn =
            type === "session"
              ? colors.session
              : type === "essay"
                ? colors.essay
                : colors.resource;
          console.log(`  ${colorFn(`[${type}]`)} ${title}`);
        }
      } else {
        console.log(colors.dim("No results found."));
      }
    } catch (err) {
      formatError((err as Error).message);
      process.exit(1);
    }
  });
