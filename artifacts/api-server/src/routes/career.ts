import { Router, type IRouter } from "express";
import {
  AnalyzeResumeBody,
  AnalyzeResumeResponse,
  GetDashboardResponse,
  GetRoleParams,
  GetRoleResponse,
  GetRolesResponse,
} from "@ai-career-advisor/api-types";
import {
  analyzeResume,
  getDemoDashboard,
  getRoleRequirements,
  getSupportedRoles,
} from "../services/career-analysis";

const router: IRouter = Router();

router.get("/dashboard", async (req, res): Promise<void> => {
  const requestedRoleId = typeof req.query.roleId === "string" ? req.query.roleId : undefined;
  try {
    if (requestedRoleId) {
      const role = await getRoleRequirements(requestedRoleId);
      if (!role) {
        res.status(400).json({ error: "Choose a supported target role." });
        return;
      }
    }
    const dashboard = await getDemoDashboard(requestedRoleId);
    res.json(GetDashboardResponse.parse(dashboard));
  } catch (error) {
    req.log.error({ err: error }, "Failed to fetch dashboard");
    res.status(500).json({ error: "Unable to load career data. Please try again." });
  }
});

router.get("/roles", async (req, res): Promise<void> => {
  try {
    const roles = await getSupportedRoles();
    res.json(GetRolesResponse.parse(roles));
  } catch (error) {
    req.log.error({ err: error }, "Failed to fetch roles");
    res.status(500).json({ error: "Unable to load career roles. Please try again." });
  }
});

router.get("/roles/:roleId", async (req, res): Promise<void> => {
  const parsed = GetRoleParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid role identifier." });
    return;
  }
  try {
    const role = await getRoleRequirements(parsed.data.roleId);
    if (!role) {
      res.status(404).json({ error: "Role not found." });
      return;
    }
    res.json(GetRoleResponse.parse(role));
  } catch (error) {
    req.log.error({ err: error }, "Failed to fetch role");
    res.status(500).json({ error: "Unable to load role requirements." });
  }
});

router.post("/resume/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeResumeBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.text.trim()) {
    res.status(400).json({ error: "Add readable resume text before analysis." });
    return;
  }
  try {
    const analysis = await analyzeResume(parsed.data.filename, parsed.data.text, parsed.data.targetRoleId);
    res.json(AnalyzeResumeResponse.parse(analysis));
  } catch (error) {
    if (error instanceof Error && error.message === "Role not found") {
      res.status(404).json({ error: "Choose a supported target role." });
      return;
    }
    req.log.error({ err: error }, "Resume analysis failed");
    res.status(500).json({ error: "Resume analysis could not be completed. Try another file or the sample resume." });
  }
});

export default router;
