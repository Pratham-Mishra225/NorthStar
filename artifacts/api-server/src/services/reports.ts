import type { Reports } from "@ai-career-advisor/api-types";
import { getDemoDashboard } from "./career-analysis";
import { getCurrentUserId } from "./userService";
import { getAllUserInteractions } from "../repositories/interactionRepository";

export async function buildReports(): Promise<Reports> {
  const userId = getCurrentUserId();
  const dashboard = await getDemoDashboard();
  const interactions = await getAllUserInteractions(userId);

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

  const daysByKey = new Map(lastSevenDays.map((d) => [d.key, d]));

  const viewedJobIds = new Set<string>();
  const appliedJobIds = new Set<string>();
  const savedJobIds = new Set<string>();

  for (const event of interactions) {
    const eventDayKey = event.timestamp.slice(0, 10);
    const day = daysByKey.get(eventDayKey);
    if (day && (event.action === "viewed" || event.action === "saved" || event.action === "applied")) {
      day[event.action] += 1;
    }

    if (event.action === "viewed") viewedJobIds.add(event.jobId);
    if (event.action === "applied") appliedJobIds.add(event.jobId);
    if (event.action === "saved") savedJobIds.add(event.jobId);
  }

  const recommendations = dashboard.recommendations;

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
    jobsViewed: viewedJobIds.size,
    jobsSaved: savedJobIds.size,
    jobsApplied: appliedJobIds.size,
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
