import { Router, type IRouter } from "express";
import {
  AnalyzeResumeBody,
  AnalyzeResumeResponse,
  GetDashboardResponse,
  GetRoleParams,
  GetRoleResponse,
  GetRolesResponse,
} from "@ai-career-advisor/api-types";
import { analyzeResume, getDemoDashboard, getRoleRequirements, getSupportedRoles } from "../services/career-analysis";

const router: IRouter = Router();

router.get("/dashboard", (req, res): void => {
  const requestedRoleId = typeof req.query.roleId === "string" ? req.query.roleId : undefined;
  if (requestedRoleId && !getRoleRequirements(requestedRoleId)) {
    res.status(400).json({ error: "Choose a supported target role." });
    return;
  }
  res.json(GetDashboardResponse.parse(getDemoDashboard(requestedRoleId)));
});

router.get("/roles", (_req, res): void => {
  res.json(GetRolesResponse.parse(getSupportedRoles()));
});

router.get("/roles/:roleId", (req, res): void => {
  const parsed = GetRoleParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid role identifier." });
    return;
  }
  const role = getRoleRequirements(parsed.data.roleId);
  if (!role) {
    res.status(404).json({ error: "Role not found." });
    return;
  }
  res.json(GetRoleResponse.parse(role));
});

router.post("/resume/analyze", (req, res): void => {
  const parsed = AnalyzeResumeBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.text.trim()) {
    res.status(400).json({ error: "Add readable resume text before analysis." });
    return;
  }
  try {
    res.json(AnalyzeResumeResponse.parse(
      analyzeResume(parsed.data.filename, parsed.data.text, parsed.data.targetRoleId),
    ));
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
