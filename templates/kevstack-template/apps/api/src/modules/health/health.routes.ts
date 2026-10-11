import { Router } from "express";
import type { HealthService } from "./health.service.ts";

/** Plain HTTP (not tRPC) so load balancers and orchestrators can probe it. */
export function createHealthRouter(healthService: HealthService): Router {
  const router = Router();

  // Liveness: the process is up. Must not depend on downstream services.
  router.get("/", (_req, res) => {
    res.json({ status: "up" });
  });

  // Readiness: dependencies are reachable, so traffic can be routed here.
  router.get("/ready", async (_req, res) => {
    const report = await healthService.checkReadiness();
    res.status(report.status === "up" ? 200 : 503).json(report);
  });

  return router;
}
