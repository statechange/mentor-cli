import { Command } from "commander";
import { apiRequest } from "../lib/api.js";
import { renderMarkdown, colors, formatError, printJson } from "../lib/format.js";

interface MentalModel {
  id: string;
  name: string;
  description?: string;
  content?: string;
}

export const modelCommand = new Command("model")
  .description("Look up a mental model")
  .argument("[name]", "Model name or ID (omit to list all)")
  .option("--json", "Output raw JSON")
  .action(async (name: string | undefined, options: { json?: boolean }) => {
    try {
      if (!name) {
        // List all models
        const models = await apiRequest<MentalModel[]>("/models");

        if (options.json) {
          printJson(models);
          return;
        }

        console.log(colors.bold("Mental Models:\n"));
        for (const m of models) {
          console.log(`  ${colors.model(m.name)}`);
          if (m.description) {
            console.log(`    ${colors.dim(m.description)}`);
          }
        }
        return;
      }

      // Look up specific model
      const model = await apiRequest<MentalModel>(`/models/${encodeURIComponent(name)}`);

      if (options.json) {
        printJson(model);
        return;
      }

      console.log(colors.bold(model.name));
      if (model.content) {
        console.log();
        console.log(renderMarkdown(model.content));
      } else if (model.description) {
        console.log();
        console.log(model.description);
      }
    } catch (err) {
      formatError((err as Error).message);
      process.exit(1);
    }
  });
