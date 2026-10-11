import { homedir } from "node:os";
import { join, relative, resolve } from "node:path";
import type { Writable } from "node:stream";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { gitInit, hasCommand, pnpmInstall } from "./post.ts";
import { ProjectName, validateProjectName } from "./project-name.ts";
import { assertTargetUsable, scaffold } from "./scaffold.ts";
import { getTemplate, type Manifest } from "./templates.ts";

const DEFAULT_TEMPLATE = "kevstack";
const DEFAULT_NAME = "my-app";

export interface CreateOptions {
  name?: string | undefined;
  path?: string | undefined;
  git?: boolean | undefined;
  install?: boolean | undefined;
}

export interface CreateContext {
  interactive: boolean;
  output: Writable;
  cwd: string;
}

/**
 * Thrown when the user cancels a prompt (Ctrl+C / Esc).
 */
export class CancelledError extends Error {
  public constructor() {
    super("Cancelled");
    this.name = "CancelledError";
  }
}

interface CreatePlan {
  name: ProjectName;
  targetDir: string;
  git: boolean;
  install: boolean;
}

interface SummaryLine {
  ok: boolean;
  text: string;
}

export async function create(
  options: CreateOptions,
  context: CreateContext,
): Promise<void> {
  const out = { output: context.output };
  const template = await getTemplate(DEFAULT_TEMPLATE);

  p.intro(pc.inverse(" create-kevstack "), out);
  const plan = await resolvePlan(options, context, template.manifest);

  const result = await scaffold(template, {
    name: plan.name,
    targetDir: plan.targetDir,
  });

  // Collected and printed at the end, so pnpm's output doesn't bury them.
  const summary: SummaryLine[] = [
    { ok: true, text: `Created ${pc.bold(plan.name.kebab)} in ${result.dir}` },
  ];

  if (result.env) {
    const { file, source, secrets } = result.env;
    summary.push({
      ok: true,
      text: `Generated ${file} from ${source} with a fresh ${secrets.join(", ")} (git-ignored, keep it private)`,
    });
  }

  const failed: string[] = [];
  if (plan.git) {
    try {
      await gitInit(result.dir);
      summary.push({ ok: true, text: "Initialized git repository" });
    } catch (error) {
      summary.push({
        ok: false,
        text: `Could not initialize git: ${messageOf(error)}`,
      });
      failed.push("git init");
    }
  }
  if (plan.install) {
    p.log.step("Installing dependencies with pnpm…", out);
    try {
      await pnpmInstall(result.dir);
      summary.push({ ok: true, text: "Installed dependencies" });
    } catch (error) {
      summary.push({
        ok: false,
        text: `Could not install dependencies: ${messageOf(error)}`,
      });
      failed.push("pnpm install");
    }
  }

  for (const line of summary) {
    if (line.ok) p.log.success(line.text, out);
    else p.log.warn(line.text, out);
  }

  const steps = [`cd ${displayPath(result.dir, context.cwd)}`];
  if (!plan.install || failed.length > 0) steps.push("pnpm install");
  steps.push("pnpm db:up", "pnpm db:migrate", "pnpm dev");
  p.note(steps.join("\n"), "Next steps", out);

  if (failed.length > 0) {
    throw new Error(
      `Project created, but these steps failed: ${failed.join(", ")}`,
    );
  }
  p.outro("Happy hacking!", out);
}

async function resolvePlan(
  options: CreateOptions,
  context: CreateContext,
  manifest: Manifest,
): Promise<CreatePlan> {
  const out = { output: context.output };
  const { interactive } = context;

  let rawName = options.name;
  if (!rawName) {
    if (!interactive) {
      throw new Error(
        "A project name is required, e.g. `create-kevstack my-app`",
      );
    }
    rawName = await ask(
      p.text({
        message: "What is your project called?",
        initialValue: DEFAULT_NAME,
        validate: (value) => validateProjectName(value ?? ""),
        ...out,
      }),
    );
  }
  const name = ProjectName.parse(rawName);
  if (name.kebab !== rawName) p.log.info(`Using ${pc.bold(name.kebab)}`, out);

  let parent = options.path;
  if (parent === undefined && interactive) {
    const location = await ask(
      p.select({
        message: "Where should it be created?",
        options: [
          {
            value: "cwd",
            label: `./${name.kebab}`,
            hint: "in the current directory",
          },
          { value: "custom", label: "Somewhere else", hint: "enter a path" },
        ],
        ...out,
      }),
    );
    if (location === "custom") {
      parent = await ask(
        p.text({
          message: "Parent directory (the project folder is created inside it)",
          placeholder: "~/code",
          validate: (value) =>
            value?.trim() ? undefined : "Enter a directory",
          ...out,
        }),
      );
    }
  }

  const targetDir = resolveTarget(parent, name, context.cwd);
  // Fail before asking anything else if the folder is already taken.
  await assertTargetUsable(targetDir);

  if (manifest.env && interactive) {
    const { to, from, secrets } = manifest.env;
    p.note(
      `${to} will be generated from ${from} with a fresh ${secrets.join(", ")}.`,
      "Environment",
      out,
    );
  }

  const git = await decide({
    flag: options.git,
    available: hasCommand("git"),
    question: "Initialize a git repository?",
    missing: "git not found; skipping git init",
    context,
  });
  const install = await decide({
    flag: options.install,
    available: hasCommand("pnpm"),
    question: "Install dependencies with pnpm?",
    missing:
      "pnpm not found; skipping install (see https://pnpm.io/installation)",
    context,
  });

  return { name, targetDir, git, install };
}

async function decide(args: {
  flag: boolean | undefined;
  available: boolean;
  question: string;
  missing: string;
  context: CreateContext;
}): Promise<boolean> {
  const { flag, available, question, missing, context } = args;

  if (flag === false) {
    return false;
  }

  if (!available) {
    p.log.warn(missing, { output: context.output });
    return false;
  }

  if (flag === true || !context.interactive){
    return true;
  }

  return ask(
    p.confirm({
      message: question,
      initialValue: true,
      output: context.output,
    }),
  );
}

/** Awaits a clack prompt, turning its cancel symbol into a CancelledError. */
async function ask<T>(prompt: Promise<T>): Promise<Exclude<T, symbol>> {
  const value = await prompt;
  if (p.isCancel(value)) throw new CancelledError();
  return value as Exclude<T, symbol>;
}

export function resolveTarget(
  parent: string | undefined,
  name: ProjectName,
  cwd: string,
): string {
  return resolve(cwd, expandHome(parent?.trim() || "."), name.kebab);
}

function expandHome(path: string): string {
  if (path === "~") {
    return homedir();
  }

  if (path.startsWith("~/")) {
    return join(homedir(), path.slice(2));
  }

  return path;
}

function displayPath(dir: string, cwd: string): string {
  const rel = relative(cwd, dir);

  return rel && !rel.startsWith("..")
    ? rel
    : dir;
}

const messageOf = (error: unknown): string => error instanceof Error ? error.message : String(error);
