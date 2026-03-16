import { Command } from "commander";
import { apiRequest } from "../lib/api.js";
import { colors, formatError, printJson } from "../lib/format.js";

interface Resource {
  resource_id: string;
  resource_type: string;
  title: string;
  summary: string;
  score: number;
}

interface Model {
  id: string;
  label: string;
  description: string;
  score: number;
  evidence: Array<{
    resource_id: string;
    resource_type: string;
    title: string;
    reasoning: string;
  }>;
}

interface SearchResponse {
  resources: Resource[];
  models: Model[];
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

      if (data.resources?.length) {
        console.log(colors.bold("Resources:\n"));
        for (const r of data.resources) {
          const colorFn =
            r.resource_type === "essay"
              ? colors.essay
              : r.resource_type === "session"
                ? colors.session
                : colors.resource;
          const score = colors.dim(`(${r.score.toFixed(2)})`);
          console.log(`  ${colorFn(`[${r.resource_type}]`)} ${r.title} ${score}`);
          if (r.summary) {
            const preview = r.summary.slice(0, 120).replace(/\n/g, " ");
            console.log(`    ${colors.dim(preview + (r.summary.length > 120 ? "..." : ""))}`);
          }
        }
        console.log();
      }

      if (data.models?.length) {
        console.log(colors.bold("Mental Models:\n"));
        for (const m of data.models) {
          const score = colors.dim(`(${m.score.toFixed(2)})`);
          console.log(`  ${colors.model(m.label)} ${score}`);
          if (m.evidence?.length) {
            const top = m.evidence[0];
            console.log(`    ${colors.dim(top.reasoning.slice(0, 120) + (top.reasoning.length > 120 ? "..." : ""))}`);
          }
        }
        console.log();
      }

      if (!data.resources?.length && !data.models?.length) {
        console.log(colors.dim("No results found."));
      }
    } catch (err) {
      formatError((err as Error).message);
      process.exit(1);
    }
  });
