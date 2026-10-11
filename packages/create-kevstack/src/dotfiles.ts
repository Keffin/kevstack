/**
 * npm mangles some dotfiles on publish (it renames `.gitignore` and drops `.npmrc`), so templates
 * are packaged with these files renamed and restored when a project is created.
 */
const PACKAGED_NAMES: Record<string, string> = {
  ".gitignore": "_gitignore",
  ".npmrc": "_npmrc",
};

const ORIGINAL_NAMES = Object.fromEntries(
  Object.entries(PACKAGED_NAMES).map(([original, packaged]) => [packaged, original]),
);

export function toPackagedPath(path: string): string {
  return mapBasename(path, PACKAGED_NAMES);
}

export function toOriginalPath(path: string): string {
  return mapBasename(path, ORIGINAL_NAMES);
}

function mapBasename(path: string, names: Record<string, string>): string {
  const slash = path.lastIndexOf("/");
  const base = path.slice(slash + 1);
  const mapped = names[base];
  return mapped ? path.slice(0, slash + 1) + mapped : path;
}
