import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { toOriginalPath } from "./dotfiles.ts";

export const MANIFEST_FILE = "template.json";

/** Describes how a template becomes a user's project. Lives in each template's template.json. */
export interface Manifest {
  id: string;
  description: string;
  /** Placeholder names baked into the template, replaced with the user's project name. */
  tokens: { kebab: string; snake: string };
  /** Env file generated from an example file, with freshly generated secrets. */
  env?: { from: string; to: string; secrets: string[] };
  /** Template-relative paths that are not copied into the project. */
  exclude?: string[];
}

export interface TemplateFile {
  path: string;
  mode: number;
  data: Buffer;
}

export interface Template {
  manifest: Manifest;
  files: TemplateFile[];
}

export const PACKAGED_TEMPLATES_DIR = fileURLToPath(new URL("../templates/", import.meta.url));

export async function loadTemplates(root: string = PACKAGED_TEMPLATES_DIR): Promise<Template[]> {
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
  const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => join(root, entry.name));
  if (dirs.length === 0) {
    throw new Error(`No templates found in ${root}. Run \`pnpm sync-templates\` first.`);
  }

  const templates = await Promise.all(dirs.map(loadTemplate));
  return templates.toSorted((a, b) => a.manifest.id.localeCompare(b.manifest.id));
}

export async function getTemplate(id: string, root?: string): Promise<Template> {
  const template = (await loadTemplates(root)).find((t) => t.manifest.id === id);
  if (!template) {
    throw new Error(`Unknown template "${id}"`)
  };
  return template;
}

async function loadTemplate(dir: string): Promise<Template> {
  const manifest = parseManifest(await readFile(join(dir, MANIFEST_FILE), "utf8"), dir);
  const paths = await readdir(dir, { recursive: true, withFileTypes: true });

  const files = await Promise.all(
    paths
      .filter((entry) => entry.isFile())
      .map(async (entry): Promise<TemplateFile> => {
        const absolute = join(entry.parentPath, entry.name);
        const [data, info] = await Promise.all([readFile(absolute), stat(absolute)]);
        return {
          path: toOriginalPath(relative(dir, absolute).split(sep).join("/")),
          mode: info.mode & 0o777,
          data,
        };
      }),
  );

  return { manifest, files: files.toSorted((a, b) => a.path.localeCompare(b.path)) };
}

function parseManifest(json: string, dir: string): Manifest {
  const manifest = JSON.parse(json) as Partial<Manifest>;
  if (!manifest.id || !manifest.tokens?.kebab || !manifest.tokens.snake) {
    throw new Error(`${join(dir, MANIFEST_FILE)}: id, tokens.kebab and tokens.snake are required`);
  }
  return manifest as Manifest;
}
