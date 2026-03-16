import { Command } from "commander";
import readline from "node:readline";
import { apiStream } from "../lib/api.js";
import { colors, formatError } from "../lib/format.js";

export const chatCommand = new Command("chat")
  .description("Start an interactive chat session with SC Mentor")
  .action(async () => {
    console.log(
      colors.bold("SC Mentor") +
        colors.dim(" — type your question, Ctrl+C to exit\n")
    );

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const history: Array<{ role: string; content: string }> = [];

    const prompt = () => {
      rl.question(colors.bold("You: "), async (input) => {
        const trimmed = input.trim();
        if (!trimmed) {
          prompt();
          return;
        }

        history.push({ role: "user", content: trimmed });

        try {
          process.stdout.write(colors.bold("\nMentor: "));
          const stream = await apiStream("/chat", { messages: history });
          const decoder = new TextDecoder();
          let fullResponse = "";

          const reader = stream.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            // Handle SSE format
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(data);
                  const text = parsed.choices?.[0]?.delta?.content || parsed.text || "";
                  if (text) {
                    process.stdout.write(text);
                    fullResponse += text;
                  }
                } catch {
                  // Not JSON, write raw
                  process.stdout.write(data);
                  fullResponse += data;
                }
              }
            }
          }

          console.log("\n");
          history.push({ role: "assistant", content: fullResponse });
        } catch (err) {
          console.log();
          formatError((err as Error).message);
          console.log();
        }

        prompt();
      });
    };

    prompt();

    rl.on("close", () => {
      console.log(colors.dim("\nGoodbye!"));
      process.exit(0);
    });
  });
