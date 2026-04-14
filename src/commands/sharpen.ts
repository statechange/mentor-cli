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

interface SharpenResult {
  instruction: string;
  situation_matches: RetrieveResponse;
  risk_matches: RetrieveResponse | null;
  current_thinking: string;
}

function retrieve(query: string, top_k: number): Promise<RetrieveResponse> {
  return apiRequest<RetrieveResponse>("/retrieve", {
    method: "POST",
    body: { query, top_k },
  });
}

function printMatches(label: string, data: RetrieveResponse): void {
  if (!data.models.length && !data.resources.length) return;
  console.log(colors.bold(`━━ ${label} ━━`));

  if (data.models.length) {
    console.log(colors.bold("\n  Models:"));
    for (const m of data.models) {
      const score = colors.dim(`(${m.score.toFixed(2)})`);
      console.log(`    ${colors.model(m.label)} ${colors.dim(`(${m.id})`)} ${score}`);
      if (m.evidence?.length && m.evidence[0]) {
        const r = m.evidence[0].reasoning.slice(0, 140).replace(/\n/g, " ");
        console.log(`      ${colors.dim(r + (m.evidence[0].reasoning.length > 140 ? "..." : ""))}`);
      }
    }
  }

  if (data.resources.length) {
    console.log(colors.bold("\n  Resources:"));
    for (const r of data.resources) {
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
  console.log();
}

export const sharpenCommand = new Command("sharpen")
  .description("Pressure-test existing thinking against State Change content")
  .requiredOption("--situation <text>", "The problem, decision, or context you're facing")
  .requiredOption("--current-thinking <text>", "What you've concluded or are leaning toward")
  .option("--what-feels-risky <text>", "What you're most uncertain or worried about")
  .option("--json", "Output raw JSON")
  .action(
    async (flags: {
      situation: string;
      currentThinking: string;
      whatFeelsRisky?: string;
      json?: boolean;
    }) => {
      try {
        const [situationResults, riskResults] = await Promise.all([
          retrieve(flags.situation, 5),
          flags.whatFeelsRisky ? retrieve(flags.whatFeelsRisky, 3) : Promise.resolve(null),
        ]);

        const result: SharpenResult = {
          instruction:
            "The user has existing thinking they want pressure-tested. Do NOT start from scratch or give a comprehensive answer. Instead: (1) Acknowledge what's solid in their current thinking. (2) Name the one assumption most likely to be wrong, using the mental models below as your lens. (3) Suggest one concrete test or question that would resolve the uncertainty. Be sharp, not thorough.",
          situation_matches: situationResults,
          risk_matches: riskResults,
          current_thinking: flags.currentThinking,
        };

        if (flags.json) {
          printJson(result);
          return;
        }

        console.log(colors.bold("Situation: ") + flags.situation);
        console.log(colors.bold("Current thinking: ") + flags.currentThinking);
        if (flags.whatFeelsRisky) {
          console.log(colors.bold("Risk: ") + flags.whatFeelsRisky);
        }
        console.log();

        printMatches("Matches for the situation", situationResults);
        if (riskResults) {
          printMatches("Matches for the risk", riskResults);
        }

        console.log(colors.dim(result.instruction));
      } catch (err) {
        formatError((err as Error).message);
        process.exit(1);
      }
    }
  );
