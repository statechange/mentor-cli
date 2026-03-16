import chalk from "chalk";
import { Marked } from "marked";
import TerminalRenderer from "marked-terminal";

const marked = new Marked(TerminalRenderer as never);

const noColor = !!process.env["NO_COLOR"];

export function renderMarkdown(text: string): string {
  if (noColor) return text;
  return marked.parse(text) as string;
}

export const colors = {
  session: noColor ? (s: string) => s : chalk.green,
  essay: noColor ? (s: string) => s : chalk.blue,
  model: noColor ? (s: string) => s : chalk.magenta,
  resource: noColor ? (s: string) => s : chalk.cyan,
  error: noColor ? (s: string) => s : chalk.red,
  dim: noColor ? (s: string) => s : chalk.dim,
  bold: noColor ? (s: string) => s : chalk.bold,
};

export function formatError(message: string): void {
  console.error(colors.error(`Error: ${message}`));
}

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}
