import { Router, type IRouter } from "express";
import {
  GetJobParams,
  GetJobResponse,
  GetJobsQueryParams,
  GetJobsResponse,
  GetRecommendationsBody,
  GetRecommendationsResponse,
} from "@ai-career-advisor/api-types";
import { getJobs, getJobById } from "../repositories/jobRepository";
import { getRoleById } from "../repositories/roleRepository";
import { getRecommendationsForRole } from "../services/career-analysis";

const router: IRouter = Router();

router.get("/jobs", async (req, res): Promise<void> => {
  const query = GetJobsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid job filters." });
    return;
  }

  try {
    const { q, category, location, jobType, workMode, sort, limit, page } = query.data;
    const result = await getJobs({
      q,
      category,
      location,
      jobType,
      workMode,
      sort: sort as "best-match" | "highest-match" | "newest" | undefined,
      limit: limit ?? 300,
      page: page ?? 1,
    });

    res.json(GetJobsResponse.parse(result));
  } catch (error) {
    req.log.error({ err: error }, "Failed to fetch jobs");
    res.status(500).json({ error: "Unable to load opportunities. Please try again." });
  }
});

router.get("/jobs/:jobId", async (req, res): Promise<void> => {
  const parsed = GetJobParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid job identifier." });
    return;
  }
  try {
    const job = await getJobById(parsed.data.jobId);
    if (!job) {
      res.status(404).json({ error: "Demo job not found." });
      return;
    }
    res.json(GetJobResponse.parse(job));
  } catch (error) {
    req.log.error({ err: error }, "Failed to fetch job details");
    res.status(500).json({ error: "Unable to load job details." });
  }
});

router.post("/recommendations", async (req, res): Promise<void> => {
  const parsed = GetRecommendationsBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.text.trim()) {
    res.status(400).json({ error: "Add readable resume text to generate recommendations." });
    return;
  }
  try {
    const role = await getRoleById(parsed.data.targetRoleId);
    if (!role) {
      res.status(404).json({ error: "Choose a supported target role." });
      return;
    }
    const recommendations = await getRecommendationsForRole(parsed.data.targetRoleId, parsed.data.text);
    res.json(GetRecommendationsResponse.parse(recommendations));
  } catch (error) {
    req.log.error({ err: error }, "Job recommendation generation failed");
    res.status(500).json({ error: "Recommendations could not be generated." });
  }
});

export default router;
