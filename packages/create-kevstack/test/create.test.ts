import { mkdtemp, rm, stat } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { Writable } from "node:stream";
import { stripVTControlCharacters } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { create, resolveTarget } from "../src/create.ts";
import { hasCommand } from "../src/post.ts";
import { ProjectName } from "../src/project-name.ts";

class Capture extends Writable {
  public text = "";

  public override _write(chunk: Buffer, _encoding: string, callback: () => void): void {
    this.text += stripVTControlCharacters(chunk.toString());
    callback();
  }
}

describe("create (non-interactive)", () => {
  let parent: string;
  let output: Capture;

  beforeEach(async () => {
    parent = await mkdtemp(join(tmpdir(), "create-test-"));
    output = new Capture();
  });

  afterEach(() => rm(parent, { recursive: true, force: true }));

  const context = () => ({ interactive: false, output, cwd: parent });

  it("creates the project and explains the generated env file", async () => {
    // Act
    await create({ name: "Daniels Project", git: false, install: false }, context());

    // Assert
    await expect(stat(join(parent, "daniels-project", "package.json"))).resolves.toBeDefined();
    await expect(stat(join(parent, "daniels-project", ".git"))).rejects.toThrow(/ENOENT/);
    expect(output.text).toContain(
      "Generated .env from .env.example with a fresh BETTER_AUTH_SECRET",
    );
    expect(output.text).toContain("cd daniels-project");
    expect(output.text).toContain("pnpm install");
  });

  it.runIf(hasCommand("git"))("initialises git when asked", async () => {
    // Act
    await create({ name: "app", git: true, install: false }, context());

    // Assert
    await expect(stat(join(parent, "app", ".git"))).resolves.toBeDefined();
    expect(output.text).toContain("Initialized git repository");
  });

  it("creates the project inside --path", async () => {
    // Act
    await create({ name: "app", path: "nested/dir", git: false, install: false }, context());

    // Assert
    await expect(stat(join(parent, "nested", "dir", "app", "package.json"))).resolves.toBeDefined();
  });

  it("requires a name when not interactive", async () => {
    // Act
    const result = create({ git: false, install: false }, context());

    // Assert
    await expect(result).rejects.toThrow(/project name is required/);
  });
});

describe("resolveTarget", () => {
  const name = ProjectName.parse("app");

  it.each([
    [undefined, "/work/app"],
    ["", "/work/app"],
    ["code", "/work/code/app"],
    ["/abs/dir", "/abs/dir/app"],
    ["~/code", join(homedir(), "code", "app")],
    ["  ~/code  ", join(homedir(), "code", "app")],
  ])("resolves %j", (parentDir, expected) => {
    // Act
    const target = resolveTarget(parentDir, name, "/work");

    // Assert
    expect(target).toBe(expected);
  });
});
