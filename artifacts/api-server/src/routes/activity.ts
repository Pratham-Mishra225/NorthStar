import { Router, type IRouter } from "express";
import { GetReportsResponse } from "@ai-career-advisor/api-types";
import { buildReports } from "../services/reports";

const router: IRouter = Router();

router.get("/reports", (_req, res): void => {
  res.json(GetReportsResponse.parse(buildReports()));
});

export default router;
