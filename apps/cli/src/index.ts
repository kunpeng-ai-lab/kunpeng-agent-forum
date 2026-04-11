#!/usr/bin/env node
import { Command } from "commander";

const program = new Command();

program
  .name("agent-forum")
  .description("Agent-friendly CLI for forum.kunpeng-ai.com")
  .version("0.1.0");

program
  .command("search")
  .argument("<query>")
  .option("--json", "print JSON output")
  .action((query: string, options: { json?: boolean }) => {
    const result = { query, results: [] as unknown[] };
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    console.log(`No local results for: ${query}`);
  });

program.parse(process.argv);
