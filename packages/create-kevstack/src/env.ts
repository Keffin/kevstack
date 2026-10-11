import { randomBytes } from "node:crypto";

const SECRET_BYTES = 32;

/** 32 random bytes, base64url-encoded */
export function generateSecret(): string {
  return randomBytes(SECRET_BYTES).toString("base64url");
}

/**
 * Renders an env file from its example: each listed secret gets a fresh value,
 * everything else is kept as-is. Secrets missing from the example are appended.
 */
export function renderEnv(
  example: string,
  secrets: readonly string[],
  generate: () => string = generateSecret,
): string {
  const remaining = new Set(secrets);

  const lines = example.split("\n").map((line) => {
    const key = line.split("=", 1)[0]?.trim() ?? "";
    if (!line.includes("=") || key.startsWith("#") || !remaining.has(key)) {
      return line;
    }
    remaining.delete(key);
    return `${key}=${generate()}`;
  });

  for (const key of remaining) {
     lines.push(`${key}=${generate()}`);
  }

  return lines.join("\n");
}
