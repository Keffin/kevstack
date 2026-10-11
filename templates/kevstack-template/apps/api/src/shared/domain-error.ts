/**
 * Category of a domain failure. Adapters (e.g. tRPC) map these to transport status codes,
 * so the domain never needs to know about HTTP.
 */
export type DomainErrorKind = "validation" | "not_found" | "conflict" | "forbidden";

export abstract class DomainError extends Error {
  public abstract readonly kind: DomainErrorKind;

  public constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidValueError extends DomainError {
  public readonly kind = "validation";
  public readonly field: string;

  public constructor(field: string, message: string) {
    super(message);
    this.field = field;
  }
}
