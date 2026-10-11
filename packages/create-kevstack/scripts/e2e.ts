/**
 * End-to-end check: creates a project with the built CLI (dist/), then runs that project's own
 * typecheck, lint and unit tests. Run via `pnpm e2e` (builds first).
 * This is to verify that the generated files are actually valid.
 */
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../dist/index.mjs", import.meta.url));
const parent = await mkdtemp(join(tmpdir(), "kevstack-e2e-"));
const project = join(parent, "e2e-app");

const run = (command: string, args: string[], cwd: string) =>
  execFileSync(command, args, { cwd, stdio: "inherit" });

try {
  run("node", [cli, "e2e-app", "--path", parent, "--git", "-y"], parent);
  run("pnpm", ["typecheck"], project);
  run("pnpm", ["lint"], project);
  run("pnpm", ["test:unit"], project);
  run("docker", ["compose", "config", "--quiet"], project);
  console.info("\ne2e: OK, successfully ran e2e");
} finally {
  await rm(parent, { recursive: true, force: true });
}
