/**
 * Copies each template under <repo>/templates into this package's templates/ folder, which is
 * what gets published to npm.
 *
 * Only files git would track are copied (`git ls-files --cached --others --exclude-standard`),
 * so node_modules, .env, build output and caches never end up in the package. Dotfiles that npm
 * would mangle are stored under safe names (see src/dotfiles.ts).
 */
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readdir, rm, stat } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { toPackagedPath } from "../src/dotfiles.ts";
import { MANIFEST_FILE } from "../src/templates.ts";

const packageDir = fileURLToPath(new URL("..", import.meta.url));
const outDir = join(packageDir, "templates");
const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  cwd: packageDir,
  encoding: "utf8",
}).trim();
const sourceDir = join(repoRoot, "templates");

await rm(outDir, { recursive: true, force: true });

const entries = await readdir(sourceDir, { withFileTypes: true });
await Promise.all(
  entries.filter((entry) => entry.isDirectory()).map((entry) => syncTemplate(entry.name)),
);

async function syncTemplate(name: string): Promise<void> {
  const templateDir = join(sourceDir, name);
  await stat(join(templateDir, MANIFEST_FILE)).catch(() => {
    throw new Error(`templates/${name} is missing ${MANIFEST_FILE}`);
  });

  const destination = join(outDir, name);
  const count = await copyTracked(templateDir, destination);
  console.info(`synced templates/${name} (${count} files) -> ${relative(packageDir, destination)}`);
}

async function copyTracked(from: string, to: string): Promise<number> {
  const listing = execFileSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard", "--", "."],
    {
      cwd: from,
      encoding: "utf8",
    },
  );
  const files = [...new Set(listing.split("\0").filter(Boolean))];

  const copied = await Promise.all(
    files.map(async (file) => {
      const source = join(from, file);
      const info = await stat(source).catch(() => undefined); // tracked but deleted locally
      if (!info?.isFile()) return false;

      const destination = join(to, toPackagedPath(file));
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(source, destination);
      return true;
    }),
  );
  return copied.filter(Boolean).length;
}
