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

interface RetrieveResponse {
  resources: Resource[];
  models: Model[];
}

interface OptionResult {
  option: string;
  resources: Resource[];
  models: Model[];
}

interface CompareResult {
  instruction: string;
  decision_context: { models: Model[] };
  comparisons: OptionResult[];
}

function retrieve(query: string, top_k: number): Promise<RetrieveResponse> {
  return apiRequest<RetrieveResponse>("/retrieve", {
    method: "POST",
    body: { query, top_k },
  });
}

export const compareCommand = new Command("compare")
  .description("Compare two or more options against State Change content")
  .argument("<options...>", 'Options to compare (e.g. "Xano" "Supabase")')
  .option("--context <context>", "What you're trying to decide")
  .option("--json", "Output raw JSON")
  .action(
    async (
      opts: string[],
      flags: { context?: string; json?: boolean }
    ) => {
      try {
        if (opts.length < 2) {
          throw new Error("compare requires at least 2 options");
        }
        if (opts.length > 5) {
          throw new Error("compare supports at most 5 options");
        }

        const context = flags.context;
        const contextQuery = context || opts.join(" vs ");

        const [contextResults, ...perOption] = await Promise.all([
          retrieve(contextQuery, 3),
          ...opts.map((o) => retrieve(context ? `${o} ${context}` : o, 3)),
        ]);

        const comparisons: OptionResult[] = opts.map((option, i) => ({
          option,
          resources: perOption[i]!.resources,
          models: perOption[i]!.models,
        }));

        const result: CompareResult = {
          instruction:
            "Before comparing options, name the one constraint or question that, if answered, would make the choice obvious. The comparison is secondary to finding that question.",
          decision_context: { models: contextResults.models },
          comparisons,
        };

        if (flags.json) {
          printJson(result);
          return;
        }

        if (context) {
          console.log(colors.bold("Context: ") + context);
          console.log();
        }

        if (result.decision_context.models.length) {
          console.log(colors.bold("Decision context — relevant mental models:\n"));
          for (const m of result.decision_context.models) {
            const score = colors.dim(`(${m.score.toFixed(2)})`);
            console.log(`  ${colors.model(m.label)} ${colors.dim(`(${m.id})`)} ${score}`);
            if (m.description) {
              const preview = m.description.slice(0, 140).replace(/\n/g, " ");
              console.log(`    ${colors.dim(preview + (m.description.length > 140 ? "..." : ""))}`);
            }
          }
          console.log();
        }

        for (const c of comparisons) {
          console.log(colors.bold(`━━ ${c.option} ━━`));
          if (c.models.length) {
            console.log(colors.bold("\n  Models:"));
            for (const m of c.models) {
              const score = colors.dim(`(${m.score.toFixed(2)})`);
              console.log(`    ${colors.model(m.label)} ${score}`);
            }
          }
          if (c.resources.length) {
            console.log(colors.bold("\n  Resources:"));
            for (const r of c.resources) {
              const colorFn =
                r.resource_type === "essay"
                  ? colors.essay
                  : r.resource_type === "session"
                    ? colors.session
                    : colors.resource;
              const score = colors.dim(`(${r.score.toFixed(2)})`);
              console.log(`    ${colorFn(`[${r.resource_type}]`)} ${r.title} ${score}`);
            }
          }
          if (!c.models.length && !c.resources.length) {
            console.log(colors.dim("  (no matches)"));
          }
          console.log();
        }

        console.log(colors.dim(result.instruction));
      } catch (err) {
        formatError((err as Error).message);
        process.exit(1);
      }
    }
  );
