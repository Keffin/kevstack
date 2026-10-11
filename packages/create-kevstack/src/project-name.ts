export const MAX_NAME_LENGTH = 50;

const VALID_NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const NON_SLUG = /[^a-z0-9]+/g;

export function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(NON_SLUG, "-")
    .replace(/^-+|-+$/g, "");
}

export function validateProjectName(raw: string): string | undefined {
  const slug = slugify(raw);
  if (slug === "") return "Project name is required";
  if (slug.length > MAX_NAME_LENGTH) {
    return `Project name must be at most ${MAX_NAME_LENGTH} characters`;
  }
  if (!VALID_NAME.test(slug)) {
    return "Use lowercase letters, numbers and single hyphens, starting with a letter";
  }
  return undefined;
}

export class ProjectName {
  /** For package and folder names. */
  public readonly kebab: string;
  /** For database identifiers. */
  public readonly snake: string;

  private constructor(kebab: string) {
    this.kebab = kebab;
    this.snake = kebab.replaceAll("-", "_");
  }

  public static parse(raw: string): ProjectName {
    const error = validateProjectName(raw);
    if (error) throw new Error(`Invalid project name "${raw}": ${error}`);
    return new ProjectName(slugify(raw));
  }
}
