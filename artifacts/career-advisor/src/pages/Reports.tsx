import { useMemo } from 'react';
import { Link } from 'wouter';
import { Activity, Target, FileCheck2, Gauge, Bookmark, BarChart3 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useGetReports } from '@ai-career-advisor/api-client';
import type { LocalState } from '@/types/career';
import { PageHeading } from '@/components/common/PageHeading';
import { DashboardSkeleton } from '@/components/common/SkeletonCard';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState, EmptySmall } from '@/components/common/EmptyState';

interface ReportsProps {
  local: LocalState;
}

export function Reports({ local }: ReportsProps) {
  const reports = useGetReports();

  const r = useMemo(() => {
    const base = reports.data;
    if (!base) return undefined;

    const days = Array.from({ length: 7 }, (_, offset) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - offset));
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        viewed: 0,
        saved: 0,
        applied: 0,
      };
    });

    const daysByKey = new Map(days.map((day) => [day.key, day]));
    for (const event of local.activityLog) {
      const date = new Date(event.timestamp);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const day = daysByKey.get(key);
      if (day) day[event.action] += 1;
    }

    const savedCount = Object.values(local.interactions).filter((actions) => actions.includes('saved')).length;
    const appliedCount = Object.values(local.interactions).filter((actions) => actions.includes('applied')).length;
    const viewedCount = new Set(local.activityLog.filter((event) => event.action === 'viewed').map((event) => event.jobId)).size;
    const analysisMatches = local.analysis?.recommendations ?? [];

    const categories = new Map<string, number>();
    for (const match of analysisMatches) {
      categories.set(match.category, (categories.get(match.category) ?? 0) + 1);
    }

    const gapRoleCounts = new Map<string, Set<string>>();
    for (const match of analysisMatches) {
      for (const skill of match.missingSkills) {
        const roleIds = gapRoleCounts.get(skill) ?? new Set<string>();
        roleIds.add(match.id);
        gapRoleCounts.set(skill, roleIds);
      }
    }

    const distribution = [
      { range: '0–39%', count: 0 },
      { range: '40–59%', count: 0 },
      { range: '60–79%', count: 0 },
      { range: '80–100%', count: 0 },
    ];
    for (const match of analysisMatches) {
      const index = match.matchScore < 40 ? 0 : match.matchScore < 60 ? 1 : match.matchScore < 80 ? 2 : 3;
      distribution[index].count += 1;
    }

    return {
      ...base,
      jobsViewed: viewedCount,
      jobsSaved: savedCount,
      jobsApplied: appliedCount,
      averageMatch: analysisMatches.length
        ? Math.round(analysisMatches.reduce((sum, job) => sum + job.matchScore, 0) / analysisMatches.length)
        : base.averageMatch,
      atsScore: local.analysis?.ats.overallScore ?? base.atsScore,
      readiness: local.analysis?.readiness ?? base.readiness,
      categories: analysisMatches.length
        ? [...categories].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
        : base.categories,
      gaps: analysisMatches.length
        ? [...gapRoleCounts].map(([name, roles]) => ({ name, count: roles.size })).sort((a, b) => b.count - a.count).slice(0, 8)
        : base.gaps,
      activity: days.map(({ day, viewed, saved, applied }) => ({ day, viewed, saved, applied })),
      distribution: analysisMatches.length ? distribution : base.distribution,
    };
  }, [reports.data, local]);

  if (reports.isLoading) {
    return (
      <>
        <PageHeading
          eyebrow="Progress"
          title="Small steps, made visible."
          subtitle="A snapshot of your activity in this demo workspace."
        />
        <DashboardSkeleton />
      </>
    );
  }

  if (reports.isError) {
    return <ErrorState title="Progress data couldn't be loaded" retry={() => reports.refetch()} />;
  }

  if (!r) {
    return (
      <EmptyState
        icon={<BarChart3 size={22} />}
        title="Your progress will appear here"
        body="Explore a demo opportunity or save a role to create a little activity."
        action={
          <Link href="/jobs" className="rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground">
            Browse demo roles
          </Link>
        }
      />
    );
  }

  const hasActivity = r.activity.some((day) => day.viewed + day.saved + day.applied > 0);

  return (
    <div>
      <PageHeading
        eyebrow="Progress"
        title="Small steps, made visible."
        subtitle="A snapshot of your activity and readiness in this demo workspace."
      />
      <div className="mb-6 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/[.04] px-4 py-3 text-xs text-muted-foreground">
        <Activity size={15} className="text-primary" /> Your activity is a record of actions you chose to take—not applications submitted.
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Average match', `${r.averageMatch}%`, 'Across demo role matches', <Target size={17} />],
          ['ATS clarity', `${r.atsScore}`, 'Resume signal score', <FileCheck2 size={17} />],
          ['Role readiness', `${r.readiness}%`, 'Against your target role', <Gauge size={17} />],
          ['Saved roles', r.jobsSaved, 'Kept for your review', <Bookmark size={17} />],
        ].map(([label, value, hint, icon]) => (
          <div
            key={String(label)}
            data-testid={`metric-${String(label).toLowerCase().replace(/\s/g, '-')}`}
            className="rounded-2xl border border-border bg-card p-5 soft-shadow"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">{label}</span>
              <span className="text-primary">{icon}</span>
            </div>
            <div className="mt-4 text-3xl font-extrabold tracking-[-.06em]">{value}</div>
            <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-7">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">Activity over time</p>
              <h2 className="mt-2 text-xl font-bold">Show up, a little at a time.</h2>
            </div>
            <span className="text-[10px] text-muted-foreground">Recent days</span>
          </div>
          {!hasActivity ? (
            <div className="mt-5">
              <EmptySmall text="No recent activity. Viewing a demo opportunity will start your timeline." />
            </div>
          ) : (
            <ChartContainer
              aria-label="Viewed, saved, and marked-applied actions by day"
              config={{
                viewed: { label: 'Viewed', color: 'hsl(var(--primary))' },
                saved: { label: 'Saved', color: '#93b6a7' },
                applied: { label: 'Marked applied', color: '#e6bd74' },
              }}
              className="mt-4 h-[210px] w-full aspect-auto"
            >
              <BarChart data={r.activity} accessibilityLayer>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={{ fontSize: 9 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="viewed" stackId="actions" fill="var(--color-viewed)" />
                <Bar dataKey="saved" stackId="actions" fill="var(--color-saved)" />
                <Bar dataKey="applied" stackId="actions" fill="var(--color-applied)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
          <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full bg-primary" />
              Viewed {r.jobsViewed}
            </span>
            <span className="flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full bg-[#93b6a7]" />
              Saved {r.jobsSaved}
            </span>
            <span className="flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full bg-[#e6bd74]" />
              Marked applied {r.jobsApplied}
            </span>
          </div>
        </section>
        <section className="rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">Where you're exploring</p>
          <h2 className="mt-2 text-xl font-bold">Role categories</h2>
          {r.categories.length ? (
            <ChartContainer
              aria-label="Number of matched jobs by role category"
              config={{ count: { label: 'Matched jobs', color: 'hsl(var(--primary))' } }}
              className="mt-4 h-[220px] w-full aspect-auto"
            >
              <BarChart data={r.categories} layout="vertical" accessibilityLayer margin={{ left: 6, right: 12 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                <YAxis type="category" dataKey="name" width={120} tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptySmall text="Explore demo roles to see category activity." />
          )}
        </section>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">Most common gaps</p>
          <h2 className="mt-2 text-xl font-bold">Skills to explore</h2>
          {r.gaps.length ? (
            <ChartContainer
              aria-label="Frequency of missing skills across matched roles"
              config={{ count: { label: 'Roles with gap', color: 'hsl(var(--primary))' } }}
              className="mt-4 h-[240px] w-full aspect-auto"
            >
              <BarChart data={r.gaps.slice(0, 8)} layout="vertical" accessibilityLayer margin={{ left: 6, right: 12 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                <YAxis type="category" dataKey="name" width={120} tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptySmall text="No recurring gaps yet. Role comparisons will surface patterns here." />
          )}
        </section>
        <section className="rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">Match distribution</p>
          <h2 className="mt-2 text-xl font-bold">Role fit at a glance</h2>
          {r.distribution.length ? (
            <ChartContainer
              aria-label="Count of job matches by match-score range"
              config={{ count: { label: 'Jobs', color: 'hsl(var(--primary))' } }}
              className="mt-4 h-[220px] w-full aspect-auto"
            >
              <BarChart data={r.distribution} accessibilityLayer>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="range" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 9 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={{ fontSize: 9 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptySmall text="Match distribution appears once roles are compared with your resume." />
          )}
        </section>
      </div>
    </div>
  );
}
