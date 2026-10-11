#!/usr/bin/env node
import * as p from "@clack/prompts";
import { cli } from "cleye";
import pkg from "../package.json" with { type: "json" };
import { CancelledError, create } from "./create.ts";

const argv = cli({
  name: "create-kevstack",
  version: pkg.version,
  parameters: ["[project name]"],
  flags: {
    path: {
      type: String,
      placeholder: "<dir>",
      description: "Parent directory for the project (default: current directory)",
    },
    git: {
      type: Boolean,
      description: "Initialize a git repository (--no-git to skip)",
    },
    install: {
      type: Boolean,
      description: "Install dependencies with pnpm (--no-install to skip)",
    },
    yes: {
      type: Boolean,
      alias: "y",
      description: "Skip prompts and use defaults (requires a project name)",
    },
  },
  booleanFlagNegation: true,
  strictFlags: true,
  help: {
    description:
      "Create a full-stack TypeScript project from the kevstack template " +
      "(React + TanStack, tRPC + Express, Drizzle + Postgres, Better Auth).",
    examples: [
      "pnpm create kevstack",
      "pnpm create kevstack daniels-project",
      "pnpm create kevstack daniels-project --path ~/code --no-install -y",
    ],
  },
});

try {
  await create(
    {
      name: argv._.projectName,
      path: argv.flags.path,
      git: argv.flags.git,
      install: argv.flags.install,
    },
    {
      interactive: !argv.flags.yes && Boolean(process.stdin.isTTY && process.stdout.isTTY),
      output: process.stdout,
      cwd: process.cwd(),
    },
  );
} catch (error) {
  if (error instanceof CancelledError) {
    p.cancel("Cancelled.");
    process.exitCode = 130;
  } else {
    p.log.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
