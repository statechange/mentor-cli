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

async function resolveModelId(nameOrId: string): Promise<string> {
  // Bare numbers: "91" → "mm-91"
  if (/^\d+$/.test(nameOrId)) return `mm-${nameOrId}`;
  // Already an ID: "mm-91"
  if (/^mm-\d+$/.test(nameOrId)) return nameOrId;
  // Treat as label — fetch list and match case-insensitively
  const list = await apiRequest<ModelListItem[]>("/models");
  const needle = nameOrId.toLowerCase().trim();
  const exact = list.find((m) => m.label.toLowerCase() === needle);
  if (exact) return exact.id;
  const partial = list.find((m) => m.label.toLowerCase().includes(needle));
  if (partial) return partial.id;
  throw new Error(`No model found matching "${nameOrId}". Try \`mentor models --search "${nameOrId}"\`.`);
}

function printModelList(models: ModelListItem[], filter?: string): void {
  const filtered = filter
    ? models.filter((m) => {
        const needle = filter.toLowerCase();
        return (
          m.label.toLowerCase().includes(needle) ||
          (m.description && m.description.toLowerCase().includes(needle)) ||
          (m.category && m.category.toLowerCase().includes(needle))
        );
      })
    : models;

  const heading = filter
    ? `Mental Models matching "${filter}" (${filtered.length}):\n`
    : `Mental Models (${filtered.length}):\n`;
  console.log(colors.bold(heading));

  if (!filtered.length) {
    console.log(colors.dim("No matches."));
    return;
  }

  for (const m of filtered) {
    const id = colors.dim(`(${m.id})`);
    console.log(`  ${colors.model(m.label)} ${id}`);
    if (m.description) {
      const preview = m.description.slice(0, 120);
      console.log(`    ${colors.dim(preview + (m.description.length > 120 ? "..." : ""))}`);
    }
  }
}

export const modelsCommand = new Command("models")
  .description("List mental models (optionally filtered)")
  .option("--search <term>", "Filter by label, description, or category")
  .option("--json", "Output raw JSON")
  .action(async (options: { search?: string; json?: boolean }) => {
    try {
      const list = await apiRequest<ModelListItem[]>("/models");
      const filtered = options.search
        ? list.filter((m) => {
            const needle = options.search!.toLowerCase();
            return (
              m.label.toLowerCase().includes(needle) ||
              (m.description && m.description.toLowerCase().includes(needle)) ||
              (m.category && m.category.toLowerCase().includes(needle))
            );
          })
        : list;
      if (options.json) {
        printJson(filtered);
        return;
      }
      printModelList(list, options.search);
    } catch (err) {
      formatError((err as Error).message);
      process.exit(1);
    }
  });

export const modelCommand = new Command("model")
  .description("Look up a mental model by ID, number, or name")
  .argument("[name]", "Model ID (mm-42), number (42), or name (\"Jobs to Be Done\"). Omit to list all.")
  .option("--json", "Output raw JSON")
  .action(async (name: string | undefined, options: { json?: boolean }) => {
    try {
      if (!name) {
        const models = await apiRequest<ModelListItem[]>("/models");

        if (options.json) {
          printJson(models);
          return;
        }

        printModelList(models);
        return;
      }

      const modelId = await resolveModelId(name);
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
