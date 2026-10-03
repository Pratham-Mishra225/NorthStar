import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@ai-career-advisor/api-types";
import { isDatabaseConnected } from "../db/mongodb";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const isConnected = isDatabaseConnected();
  const data = HealthCheckResponse.parse({
    status: "ok",
    database: isConnected ? "connected" : "disconnected",
  });
  res.json(data);
});

export default router;
