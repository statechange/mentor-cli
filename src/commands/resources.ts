import { Command } from "commander";
import { apiRequest } from "../lib/api.js";
import { renderMarkdown, colors, formatError, printJson } from "../lib/format.js";

interface Resource {
  id: string;
  title: string;
  type?: string;
  description?: string;
  content?: string;
}

export const resourcesCommand = new Command("resources")
  .description("List available resources")
  .option("--json", "Output raw JSON")
  .action(async (options: { json?: boolean }) => {
    try {
      const resources = await apiRequest<Resource[]>("/resources");

      if (options.json) {
        printJson(resources);
        return;
      }

      console.log(colors.bold("Resources:\n"));
      for (const r of resources) {
        const type = r.type || "resource";
        const colorFn =
          type === "session"
            ? colors.session
            : type === "essay"
              ? colors.essay
              : colors.resource;
        console.log(`  ${colorFn(`[${type}]`)} ${r.title} ${colors.dim(`(${r.id})`)}`);
      }
    } catch (err) {
      formatError((err as Error).message);
      process.exit(1);
    }
  });

export const resourceCommand = new Command("resource")
  .description("View a specific resource")
  .argument("<id>", "Resource ID")
  .option("--json", "Output raw JSON")
  .action(async (id: string, options: { json?: boolean }) => {
    try {
      const resource = await apiRequest<Resource>(
        `/resources/${encodeURIComponent(id)}`
      );

      if (options.json) {
        printJson(resource);
        return;
      }

      const type = resource.type || "resource";
      const colorFn =
        type === "session"
          ? colors.session
          : type === "essay"
            ? colors.essay
            : colors.resource;

      console.log(`${colorFn(`[${type}]`)} ${colors.bold(resource.title)}`);
      if (resource.content) {
        console.log();
        console.log(renderMarkdown(resource.content));
      } else if (resource.description) {
        console.log();
        console.log(resource.description);
      }
    } catch (err) {
      formatError((err as Error).message);
      process.exit(1);
    }
  });
