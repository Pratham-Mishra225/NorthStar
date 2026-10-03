import { Router, type IRouter } from "express";
import {
  GetReportsResponse,
  GetInteractionsResponse,
  RecordInteractionBody,
  RecordInteractionResponse,
} from "@ai-career-advisor/api-types";
import { buildReports } from "../services/reports";
import {
  getCurrentUserInteractions,
  recordUserInteraction,
} from "../services/interactionService";

const router: IRouter = Router();

router.get("/reports", async (req, res): Promise<void> => {
  try {
    const reports = await buildReports();
    res.json(GetReportsResponse.parse(reports));
  } catch (error) {
    req.log.error({ err: error }, "Failed to build reports");
    res.status(500).json({ error: "Unable to load progress analytics." });
  }
});

router.get("/interactions", async (req, res): Promise<void> => {
  try {
    const data = await getCurrentUserInteractions();
    res.json(GetInteractionsResponse.parse(data));
  } catch (error) {
    req.log.error({ err: error }, "Failed to fetch user interactions");
    res.status(500).json({ error: "Unable to load interactions." });
  }
});

router.post("/interactions", async (req, res): Promise<void> => {
  const parsed = RecordInteractionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid interaction payload. Action must be viewed, saved, or applied." });
    return;
  }
  try {
    const updated = await recordUserInteraction(parsed.data.jobId, parsed.data.action);
    res.json(RecordInteractionResponse.parse(updated));
  } catch (error) {
    req.log.error({ err: error }, "Failed to record user interaction");
    res.status(500).json({ error: "Unable to save interaction." });
  }
});

export default router;
