import { Gauge, FileCheck2, Target, BriefcaseBusiness } from 'lucide-react';
import type { AtsAnalysis } from '@ai-career-advisor/api-client';

interface DashboardMetricsProps {
  readiness: number;
  ats?: AtsAnalysis;
  matchAverage: number | null;
  jobsFound: number;
}

export function DashboardMetrics({ readiness, ats, matchAverage, jobsFound }: DashboardMetricsProps) {
  const metrics = [
    { key: 'readiness', label: 'Role readiness', value: `${readiness}%`, hint: 'Weighted listed skills', Icon: Gauge },
    { key: 'ats', label: 'ATS-style score', value: ats ? `${ats.overallScore}/100` : '—', hint: 'Explainable resume heuristic', Icon: FileCheck2 },
    { key: 'average-match', label: 'Average job match', value: matchAverage === null ? '—' : `${matchAverage}%`, hint: 'Across target-role listings', Icon: Target },
    { key: 'jobs-found', label: 'Jobs found', value: jobsFound, hint: 'Synthetic demo dataset', Icon: BriefcaseBusiness },
  ];

  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ key, label, value, hint, Icon }) => (
        <div key={key} data-testid={`metric-dashboard-${key}`} className="rounded-2xl border border-border bg-card p-4 soft-shadow">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">{label}</span>
            <Icon size={16} className="text-primary" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-[-.05em]">{value}</div>
          <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>
        </div>
      ))}
    </div>
  );
}
