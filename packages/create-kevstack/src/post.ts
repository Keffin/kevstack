import { spawn, spawnSync } from "node:child_process";

const shell = process.platform === "win32";

export function hasCommand(name: string): boolean {
  const result = spawnSync(name, ["--version"], { stdio: "ignore", shell });
  return result.status === 0;
}

export function gitInit(dir: string): Promise<void> {
  return run("git", ["init", "--quiet"], dir, "pipe");
}

export function pnpmInstall(dir: string): Promise<void> {
  return run("pnpm", ["install"], dir, "inherit");
}

function run(
  command: string,
  args: string[],
  cwd: string,
  stdio: "pipe" | "inherit",
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio, shell });
    let stderr = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `${command} ${args.join(" ")} exited with code ${code}${stderr ? `: ${stderr.trim()}` : ""}`,
          ),
        );
      }
    });
  });
}
