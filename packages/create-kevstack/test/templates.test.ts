import { access, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ProjectName } from "../src/project-name.ts";
import { scaffold } from "../src/scaffold.ts";
import { getTemplate } from "../src/templates.ts";

describe("kevstack template", () => {
  let parent: string;

  beforeEach(async () => {
    parent = await mkdtemp(join(tmpdir(), "template-test-"));
  });

  afterEach(() => rm(parent, { recursive: true, force: true }));

  it("scaffolds cleanly under a new name", async () => {
    // Arrange
    const template = await getTemplate("kevstack");
    const target = join(parent, "daniels-project");

    // Act
    const result = await scaffold(template, { name: ProjectName.parse("daniels-project"), targetDir: target });

    // Assert
    expect(result.env?.file).toBe(".env");

    const exists = (path: string) => access(join(target, path)).then(() => true, () => false);
    const required = [".gitignore", ".env", ".env.example", "package.json", "pnpm-lock.yaml"];
    const unwanted = ["template.json", "_gitignore", "node_modules", "apps/web/dist"];
    expect(await Promise.all(required.map(exists))).toEqual(required.map(() => true));
    expect(await Promise.all(unwanted.map(exists))).toEqual(unwanted.map(() => false));

    const pkg = JSON.parse(await readFile(join(target, "package.json"), "utf8")) as { name: string };
    expect(pkg.name).toBe("daniels-project");

    const tokens = [template.manifest.tokens.kebab, template.manifest.tokens.snake];
    const files = (await readdir(target, { recursive: true, withFileTypes: true }))
      .filter((entry) => entry.isFile())
      .map((entry) => join(entry.parentPath, entry.name));
    const contents = await Promise.all(files.map((path) => readFile(path, "utf8")));
    const leftovers = files.flatMap((path, i) =>
      tokens
        .filter((token) => path.includes(token) || contents[i]?.includes(token))
        .map((token) => `${token} in ${relative(target, path)}`),
    );
    expect(leftovers).toEqual([]);
  });
});
