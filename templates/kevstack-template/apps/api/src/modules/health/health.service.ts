import type { Database } from "@repo/db";
import { sql } from "drizzle-orm";

export type CheckStatus = "up" | "down";

export interface ReadinessReport {
  status: CheckStatus;
  checks: {
    database: { status: CheckStatus; latencyMs: number };
  };
}

const DEFAULT_TIMEOUT_MS = 2_000;

export class HealthService {
  private readonly db: Database;
  private readonly timeoutMs: number;

  public constructor(db: Database, timeoutMs: number = DEFAULT_TIMEOUT_MS) {
    this.db = db;
    this.timeoutMs = timeoutMs;
  }

  /** Readiness: can this instance serve traffic? Fails if Postgres is unreachable or slow. */
  public async checkReadiness(): Promise<ReadinessReport> {
    const database = await this.pingDatabase();
    return { status: database.status, checks: { database } };
  }

  private async pingDatabase(): Promise<{ status: CheckStatus; latencyMs: number }> {
    const start = performance.now();
    try {
      await withTimeout(this.db.execute(sql`select 1`), this.timeoutMs);
      return { status: "up", latencyMs: elapsedSince(start) };
    } catch (error) {
      console.error("Readiness check: database ping failed", error);
      return { status: "down", latencyMs: elapsedSince(start) };
    }
  }
}

function elapsedSince(start: number): number {
  return Math.round(performance.now() - start);
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
