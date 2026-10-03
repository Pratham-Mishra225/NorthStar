import type { Reports } from "@ai-career-advisor/api-types";
import { getDemoDashboard, recommendJobs } from "./career-analysis";
import { demoResume } from "../data/career-data";

export function buildReports(): Reports {
  const dashboard = getDemoDashboard();
  const recommendations = recommendJobs(demoResume, "data-analyst");
  const lastSevenDays = Array.from({ length: 7 }, (_, offset) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - offset));
    const key = day.toISOString().slice(0, 10);
    return {
      key,
      day: day.toLocaleDateString("en", { weekday: "short" }),
      viewed: 0,
      saved: 0,
      applied: 0,
    };
  });

  const categories = new Map<string, number>();
  for (const match of recommendations.slice(0, 60)) {
    categories.set(match.category, (categories.get(match.category) ?? 0) + 1);
  }
  const gaps = new Map<string, number>();
  for (const match of recommendations.slice(0, 40)) {
    for (const skill of match.missingSkills.slice(0, 3)) {
      gaps.set(skill, (gaps.get(skill) ?? 0) + 1);
    }
  }
  const distribution = [
    { range: "0–39%", count: 0 },
    { range: "40–59%", count: 0 },
    { range: "60–79%", count: 0 },
    { range: "80–100%", count: 0 },
  ];
  for (const match of recommendations) {
    const index = match.matchScore < 40 ? 0 : match.matchScore < 60 ? 1 : match.matchScore < 80 ? 2 : 3;
    distribution[index].count += 1;
  }

  return {
    jobsViewed: 0,
    jobsSaved: 0,
    jobsApplied: 0,
    averageMatch: recommendations.length
      ? Math.round(recommendations.reduce((sum, match) => sum + match.matchScore, 0) / recommendations.length)
      : 0,
    atsScore: dashboard.ats.overallScore,
    readiness: dashboard.readiness,
    categories: [...categories].map(([name, count]) => ({ name, count })),
    gaps: [...gaps]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count })),
    activity: lastSevenDays.map(({ day, viewed, saved, applied }) => ({ day, viewed, saved, applied })),
    distribution,
  };
}
