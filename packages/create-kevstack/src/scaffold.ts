import { chmod, mkdir, mkdtemp, readdir, readFile, rename, rm, rmdir, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { renderEnv } from "./env.ts";
import type { ProjectName } from "./project-name.ts";
import type { Template, TemplateFile } from "./templates.ts";

const BINARY_SNIFF_LENGTH = 8000;

export class TargetNotEmptyError extends Error {
  public constructor(dir: string) {
    super(`Target directory is not empty: ${dir}`);
    this.name = "TargetNotEmptyError";
  }
}

export interface ScaffoldOptions {
  name: ProjectName;
  targetDir: string;
}

export interface ScaffoldResult {
  dir: string;
  env?: { file: string; source: string; secrets: string[] };
}

/**
 * Writes `template` into `options.targetDir`, replacing the template's name tokens with the
 * project name. Everything is written to a staging directory first and moved into place at the
 * end, so a failure never leaves a half-written project behind.
 */
export async function scaffold(template: Template, options: ScaffoldOptions): Promise<ScaffoldResult> {
  const target = resolve(options.targetDir);
  const targetExists = await assertTargetUsable(target);

  const parent = dirname(target);
  await mkdir(parent, { recursive: true });
  const staging = await mkdtemp(join(parent, `.${basename(target)}.kevstack-tmp-`));

  try {
    const { manifest } = template;
    const replace = createReplacer({
      [manifest.tokens.kebab]: options.name.kebab,
      [manifest.tokens.snake]: options.name.snake,
    });

    const included = template.files.filter((file) => !manifest.exclude?.includes(file.path));
    await Promise.all(included.map((file) => writeTemplateFile(staging, file, replace)));

    const result: ScaffoldResult = { dir: target };
    if (manifest.env) {
      const { from, to, secrets } = manifest.env;
      const example = await readFile(join(staging, from), "utf8");
      await writeFile(join(staging, to), renderEnv(example, secrets), { mode: 0o600 });
      result.env = { file: to, source: from, secrets };
    }

    await chmod(staging, 0o755);
    if (targetExists) await rmdir(target);
    await rename(staging, target);
    return result;
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

export async function assertTargetUsable(target: string): Promise<boolean> {
  try {
    const entries = await readdir(target);
    if (entries.length > 0) throw new TargetNotEmptyError(target);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;
    throw error;
  }
}

async function writeTemplateFile(root: string, file: TemplateFile, replace: (text: string) => string) {
  const segments = file.path.split("/");
  if (file.path.startsWith("/") || segments.some((s) => s === ".." || s === "")) {
    throw new Error(`Invalid template path "${file.path}"`);
  }

  const destination = join(root, ...replace(file.path).split("/"));
  await mkdir(dirname(destination), { recursive: true });

  const data = isText(file.data) ? Buffer.from(replace(file.data.toString("utf8"))) : file.data;
  await writeFile(destination, data, { mode: file.mode || 0o644 });
}

function isText(data: Buffer): boolean {
  return !data.subarray(0, BINARY_SNIFF_LENGTH).includes(0);
}

function createReplacer(replacements: Record<string, string>): (text: string) => string {
  const keys = Object.keys(replacements).toSorted((a, b) => b.length - a.length);
  const pattern = new RegExp(keys.map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "g");
  return (text) => text.replace(pattern, (match) => replacements[match] ?? match);
}
