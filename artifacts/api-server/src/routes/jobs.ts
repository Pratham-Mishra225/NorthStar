import { Router, type IRouter } from "express";
import {
  GetJobParams,
  GetJobResponse,
  GetJobsQueryParams,
  GetJobsResponse,
  GetRecommendationsBody,
  GetRecommendationsResponse,
} from "@ai-career-advisor/api-types";
import { jobs, jobById, roleById } from "../data/career-data";
import { getRecommendationsForRole } from "../services/career-analysis";

const router: IRouter = Router();

router.get("/jobs", (req, res): void => {
  const query = GetJobsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid job filters." });
    return;
  }

  const { q, category, location, jobType, workMode, sort, limit } = query.data;
  const search = q?.trim().toLowerCase();
  const categoryFilter = category?.trim().toLowerCase();
  const locationFilter = location?.trim().toLowerCase();
  const result = jobs
    .filter((job) => job.active)
    .filter((job) => !search || [
      job.title, job.company, job.city, job.category, job.description,
      ...job.skills.map((skill) => skill.name),
    ].join(" ").toLowerCase().includes(search))
    .filter((job) => !categoryFilter || job.category.toLowerCase() === categoryFilter)
    .filter((job) => !locationFilter || job.city.toLowerCase().includes(locationFilter))
    .filter((job) => !jobType || job.jobType.toLowerCase() === jobType.toLowerCase())
    .filter((job) => !workMode || job.workMode.toLowerCase() === workMode.toLowerCase());

  if (sort === "newest") result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  else result.sort((a, b) => a.title.localeCompare(b.title) || a.company.localeCompare(b.company));
  res.json(GetJobsResponse.parse(result.slice(0, limit ?? 300)));
});

router.get("/jobs/:jobId", (req, res): void => {
  const parsed = GetJobParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid job identifier." });
    return;
  }
  const job = jobById(parsed.data.jobId);
  if (!job) {
    res.status(404).json({ error: "Demo job not found." });
    return;
  }
  res.json(GetJobResponse.parse(job));
});

router.post("/recommendations", (req, res): void => {
  const parsed = GetRecommendationsBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.text.trim()) {
    res.status(400).json({ error: "Add readable resume text to generate recommendations." });
    return;
  }
  if (!roleById(parsed.data.targetRoleId)) {
    res.status(404).json({ error: "Choose a supported target role." });
    return;
  }
  try {
    res.json(GetRecommendationsResponse.parse(
      getRecommendationsForRole(parsed.data.targetRoleId, parsed.data.text),
    ));
  } catch (error) {
    req.log.error({ err: error }, "Job recommendation generation failed");
    res.status(500).json({ error: "Recommendations could not be generated." });
  }
});

export default router;
