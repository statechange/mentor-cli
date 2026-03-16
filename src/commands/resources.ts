import { Command } from "commander";
import { apiRequest } from "../lib/api.js";
import { renderMarkdown, colors, formatError, printJson } from "../lib/format.js";

interface ResourceListItem {
  id: string;
  title: string;
  resourceType: string;
  description: string;
  modelCount: number;
}

interface ResourceDetail {
  id: string;
  resource_type: string;
  title: string;
  summary: string;
  markdown: string;
  transcript: string;
  connected_models: Array<{ model_id: string; model_label: string }>;
}

export const resourcesCommand = new Command("resources")
  .description("List available resources")
  .option("--json", "Output raw JSON")
  .action(async (options: { json?: boolean }) => {
    try {
      const resources = await apiRequest<ResourceListItem[]>("/resources");

      if (options.json) {
        printJson(resources);
        return;
      }

      console.log(colors.bold(`Resources (${resources.length}):\n`));
      for (const r of resources) {
        const type = r.resourceType || "resource";
        const colorFn =
          type === "session"
            ? colors.session
            : type === "essay"
              ? colors.essay
              : colors.resource;
        const models = r.modelCount
          ? colors.dim(`(${r.modelCount} models)`)
          : "";
        console.log(`  ${colorFn(`[${type}]`)} ${r.title} ${colors.dim(`(${r.id})`)} ${models}`);
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
      const resource = await apiRequest<ResourceDetail>(
        `/resources/${encodeURIComponent(id)}`
      );

      if (options.json) {
        printJson(resource);
        return;
      }

      const type = resource.resource_type || "resource";
      const colorFn =
        type === "session"
          ? colors.session
          : type === "essay"
            ? colors.essay
            : colors.resource;

      console.log(`${colorFn(`[${type}]`)} ${colors.bold(resource.title)}`);

      if (resource.connected_models?.length) {
        console.log(
          colors.dim(
            `Models: ${resource.connected_models.map((m) => m.model_label).join(", ")}`
          )
        );
      }

      console.log();

      if (resource.markdown) {
        console.log(renderMarkdown(resource.markdown));
      } else if (resource.summary) {
        console.log(resource.summary);
      } else if (resource.transcript) {
        console.log(resource.transcript);
      }
    } catch (err) {
      formatError((err as Error).message);
      process.exit(1);
    }
  });
