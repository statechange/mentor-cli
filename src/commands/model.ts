import { Command } from "commander";
import { apiRequest } from "../lib/api.js";
import { renderMarkdown, colors, formatError, printJson } from "../lib/format.js";

interface ModelListItem {
  id: string;
  label: string;
  description: string;
  category: string;
  tier: string;
  coreInsight: string;
  resourceCount: number;
}

interface ModelDetail {
  id: string;
  label: string;
  description: string;
  category: string;
  coreInsight: string;
  mindsetShift: string;
  keyPractices: string[];
  synthesizedContent: string;
  infographicUrl?: string;
}

export const modelCommand = new Command("model")
  .description("Look up a mental model")
  .argument("[name]", "Model name or ID (omit to list all)")
  .option("--json", "Output raw JSON")
  .action(async (name: string | undefined, options: { json?: boolean }) => {
    try {
      if (!name) {
        const models = await apiRequest<ModelListItem[]>("/models");

        if (options.json) {
          printJson(models);
          return;
        }

        console.log(colors.bold("Mental Models:\n"));
        for (const m of models) {
          const id = colors.dim(`(${m.id})`);
          console.log(`  ${colors.model(m.label)} ${id}`);
          if (m.description) {
            const preview = m.description.slice(0, 120);
            console.log(`    ${colors.dim(preview + (m.description.length > 120 ? "..." : ""))}`);
          }
        }
        return;
      }

      // Support bare numbers: "91" → "mm-91"
      const modelId = /^\d+$/.test(name) ? `mm-${name}` : name;
      const model = await apiRequest<ModelDetail>(`/models/${encodeURIComponent(modelId)}`);

      if (options.json) {
        printJson(model);
        return;
      }

      console.log(colors.bold(model.label));
      if (model.category) {
        console.log(colors.dim(`Category: ${model.category}`));
      }
      console.log();

      if (model.description) {
        console.log(model.description);
        console.log();
      }

      if (model.coreInsight) {
        console.log(colors.bold("Core Insight:"));
        console.log(`  ${model.coreInsight}`);
        console.log();
      }

      if (model.mindsetShift) {
        console.log(colors.bold("Mindset Shift:"));
        console.log(`  ${model.mindsetShift}`);
        console.log();
      }

      if (model.keyPractices?.length) {
        console.log(colors.bold("Key Practices:"));
        for (const p of model.keyPractices) {
          console.log(`  - ${p}`);
        }
        console.log();
      }

      if (model.synthesizedContent) {
        console.log(renderMarkdown(model.synthesizedContent));
      }
    } catch (err) {
      formatError((err as Error).message);
      process.exit(1);
    }
  });
