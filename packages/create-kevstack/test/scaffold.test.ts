import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ProjectName } from "../src/project-name.ts";
import { scaffold, TargetNotEmptyError } from "../src/scaffold.ts";
import type { Template } from "../src/templates.ts";

const file = (path: string, content: string | Buffer, mode = 0o644) => ({
  path,
  mode,
  data: Buffer.isBuffer(content) ? content : Buffer.from(content),
});

const fixture = (): Template => ({
  manifest: {
    id: "fixture",
    description: "test fixture",
    tokens: { kebab: "kevstack-template", snake: "kevstack_template" },
    env: { from: ".env.example", to: ".env", secrets: ["AUTH_SECRET"] },
    exclude: ["template.json"],
  },
  files: [
    file("template.json", '{"id":"fixture"}'),
    file("package.json", '{"name":"kevstack-template"}'),
    file("docker-compose.yaml", "POSTGRES_DB: kevstack_template\n"),
    file("docs/kevstack-template.md", "# kevstack-template\n"),
    file("bin/tool", "#!/bin/sh\necho kevstack-template\n", 0o755),
    file("logo.png", Buffer.from("\x89PNG\x00kevstack-template", "latin1")),
    file(
      ".env.example",
      "DATABASE_URL=postgres://localhost/kevstack_template\nAUTH_SECRET=change-me\n",
    ),
  ],
});

const envValue = (env: string, key: string) =>
  env
    .split("\n")
    .find((line) => line.startsWith(`${key}=`))
    ?.slice(key.length + 1);

describe("scaffold", () => {
  let parent: string;
  let target: string;
  const name = ProjectName.parse("daniels-project");

  beforeEach(async () => {
    parent = await mkdtemp(join(tmpdir(), "scaffold-test-"));
    target = join(parent, "daniels-project");
  });

  afterEach(() => rm(parent, { recursive: true, force: true }));

  it("replaces name tokens in file contents and paths", async () => {
    // Act
    await scaffold(fixture(), { name, targetDir: target });

    // Assert
    expect(await readFile(join(target, "package.json"), "utf8")).toBe('{"name":"daniels-project"}');
    expect(await readFile(join(target, "docker-compose.yaml"), "utf8")).toBe(
      "POSTGRES_DB: daniels_project\n",
    );
    expect(await readFile(join(target, "docs/daniels-project.md"), "utf8")).toBe(
      "# daniels-project\n",
    );
  });

  it("leaves binary files untouched", async () => {
    // Act
    await scaffold(fixture(), { name, targetDir: target });

    // Assert
    const logo = await readFile(join(target, "logo.png"));
    expect(logo.toString("latin1")).toBe("\x89PNG\x00kevstack-template");
  });

  it("honours excludes and file modes", async () => {
    // Act
    await scaffold(fixture(), { name, targetDir: target });

    // Assert
    await expect(stat(join(target, "template.json"))).rejects.toThrow(/ENOENT/);
    expect((await stat(target)).mode & 0o777).toBe(0o755);
    expect((await stat(join(target, "bin/tool"))).mode & 0o777).toBe(0o755);
    expect((await stat(join(target, ".env"))).mode & 0o777).toBe(0o600);
  });

  it("generates the env file with a fresh secret", async () => {
    // Act
    const result = await scaffold(fixture(), { name, targetDir: target });

    // Assert
    expect(result.env).toEqual({ file: ".env", source: ".env.example", secrets: ["AUTH_SECRET"] });
    const env = await readFile(join(target, ".env"), "utf8");
    expect(env).toContain("DATABASE_URL=postgres://localhost/daniels_project\n");
    expect(envValue(env, "AUTH_SECRET")).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(await readFile(join(target, ".env.example"), "utf8")).toContain("AUTH_SECRET=change-me");
  });

  it("accepts an existing empty target directory", async () => {
    // Arrange
    await mkdir(target);

    // Act
    await scaffold(fixture(), { name, targetDir: target });

    // Assert
    expect(await readFile(join(target, "package.json"), "utf8")).toContain("daniels-project");
  });

  it("rejects a non-empty target and leaves it untouched", async () => {
    // Arrange
    await mkdir(target);
    await writeFile(join(target, "existing.txt"), "keep me");

    // Act
    const result = scaffold(fixture(), { name, targetDir: target });

    // Assert
    await expect(result).rejects.toBeInstanceOf(TargetNotEmptyError);
    expect(await readdir(target)).toEqual(["existing.txt"]);
    expect(await readdir(parent)).toEqual(["daniels-project"]);
  });

  it("leaves nothing behind when it fails", async () => {
    // Arrange
    const template = fixture();
    template.files.push(file("../escape.txt", "nope"));

    // Act
    const result = scaffold(template, { name, targetDir: target });

    // Assert
    await expect(result).rejects.toThrow(/Invalid template path/);
    expect(await readdir(parent)).toEqual([]);
  });
});
