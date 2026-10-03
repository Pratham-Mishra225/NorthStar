import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Compass, Sparkles, LoaderCircle } from 'lucide-react';
import {
  getGetDashboardQueryKey,
  getGetReportsQueryKey,
  useAnalyzeResume,
  useGetDashboard,
  useGetRecommendations,
  useGetRoles,
} from '@ai-career-advisor/api-client';
import type { Job } from '@ai-career-advisor/api-client';
import type { LocalState, ActivityAction } from '@/types/career';
import { PageHeading } from '@/components/common/PageHeading';
import { EmptyState, EmptySmall } from '@/components/common/EmptyState';
import { ErrorState, InlineError } from '@/components/common/ErrorState';
import { DashboardSkeleton } from '@/components/common/SkeletonCard';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { RoleRequirementsCard } from '@/components/dashboard/RoleRequirementsCard';
import { ReadinessCard } from '@/components/dashboard/ReadinessCard';
import { AtsScoreCard } from '@/components/dashboard/AtsScoreCard';
import { SkillProfileCard } from '@/components/dashboard/SkillProfileCard';
import { SkillGapsCard } from '@/components/dashboard/SkillGapsCard';
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard';
import { MatchCard } from '@/components/jobs/MatchCard';

interface DashboardProps {
  local: LocalState;
  resumeText: string;
  persist: (s: LocalState) => void;
  addInteraction: (id: string, action: ActivityAction) => void;
}

export function Dashboard({ local, resumeText, persist, addInteraction }: DashboardProps) {
  const queryRoleId = local.analysis?.targetRole.id || local.targetRoleId;
  const q = useGetDashboard(queryRoleId ? { roleId: queryRoleId } : undefined);
  const roles = useGetRoles();
  const recom = useGetRecommendations();
  const roleAnalysis = useAnalyzeResume();
  const queryClient = useQueryClient();
  const data = q.data;
  const analysis = local.analysis;
  const readiness = analysis?.readiness ?? data?.readiness ?? 0;
  const ats = analysis?.ats ?? data?.ats;
  const skills = analysis?.skills ?? data?.skills ?? [];
  const role = analysis?.targetRole ?? data?.targetRole;
  const recommendations = recom.data ?? analysis?.recommendations ?? data?.recommendations ?? [];
  const skillGaps = analysis?.missingRoleSkills ?? (role?.skills ?? [])
    .filter((required) => !skills.some((skill) => skill.name.toLowerCase() === required.name.toLowerCase()))
    .sort((a, b) => b.weight - a.weight);

  const refreshRecommendations = () => {
    const id = local.targetRoleId || role?.id;
    if (!resumeText || !id) return;
    recom.mutate({ data: { text: resumeText, targetRoleId: id } });
  };

  const act = (job: Job, action: ActivityAction) => {
    addInteraction(job.id, action);
  };

  const matchAverage = recommendations.length
    ? Math.round(recommendations.reduce((sum, job) => sum + job.matchScore, 0) / recommendations.length)
    : null;

  const recentTitles = new Map(recommendations.map((job) => [job.id, job.title]));

  if (q.isLoading) return <DashboardSkeleton />;
  if (q.isError && !analysis) return <ErrorState title="We couldn't load your workspace" retry={() => q.refetch()} />;
  if (!data && !analysis) {
    return (
      <EmptyState
        icon={<Compass size={22} />}
        title="Your workspace starts with a role"
        body="Share your resume and choose a target role to see a clear, evidence-led view of your next steps."
        action={
          <Link href="/analyze" className="rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground">
            Analyze a resume
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          eyebrow="Your workspace"
          title={analysis ? 'Your career workspace.' : `Good to see you${data?.name ? `, ${data.name.split(' ')[0]}` : ''}.`}
          subtitle={role ? `A practical look at your path toward ${role.name}.` : 'Your career readiness, with the reasoning in view.'}
        />
        <div className="mb-7 min-w-[220px]">
          <label htmlFor="dashboard-target-role" className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">
            Target role
          </label>
          <select
            id="dashboard-target-role"
            data-testid="select-dashboard-target-role"
            value={role?.id ?? ''}
            disabled={roles.isLoading || roleAnalysis.isPending || Boolean(analysis && !resumeText)}
            onChange={(event) => {
              const nextRoleId = event.target.value;
              if (!nextRoleId || nextRoleId === role?.id) return;
              if (analysis && resumeText) {
                roleAnalysis.mutate(
                  { data: { filename: analysis.filename, text: resumeText, targetRoleId: nextRoleId } },
                  {
                    onSuccess: (result) => {
                      persist({ ...local, targetRoleId: nextRoleId, analysis: result });
                      queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey({ roleId: nextRoleId }) });
                      queryClient.invalidateQueries({ queryKey: getGetReportsQueryKey() });
                    },
                  }
                );
              } else {
                persist({ ...local, targetRoleId: nextRoleId });
              }
            }}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-xs font-semibold outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {roles.data?.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          {analysis && !resumeText && (
            <p className="mt-1.5 max-w-[270px] text-[10px] leading-4 text-muted-foreground">
              Re-upload your resume to compare it with another role; resume text is not stored.
            </p>
          )}
          {roleAnalysis.isError && <p className="mt-1.5 text-[10px] text-destructive">Could not re-analyze this resume for that role.</p>}
        </div>
        <span className="mb-7 rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">
          {analysis ? 'Your resume' : 'Demo profile · sample resume'}
        </span>
      </div>

      {q.isError && <InlineError retry={() => q.refetch()} />}

      <DashboardMetrics
        readiness={readiness}
        ats={ats}
        matchAverage={matchAverage}
        jobsFound={data?.jobsFound ?? 0}
      />

      {role && <RoleRequirementsCard role={role} skills={skills} />}

      <div className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
        <ReadinessCard role={role} readiness={readiness} />
        <AtsScoreCard ats={ats} />
      </div>

      <SkillProfileCard skills={skills} />

      <div className="mt-5 grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
        <SkillGapsCard skillGaps={skillGaps} improvementPlan={analysis?.improvementPlan} />

        <section className="rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">Top recommendations</p>
              <h2 className="mt-2 text-xl font-bold">Demo opportunities worth a look</h2>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Fit blends 70% weighted listed skills and 30% resume-to-description text similarity.
              </p>
            </div>
            <button
              type="button"
              onClick={refreshRecommendations}
              disabled={!resumeText || recom.isPending}
              data-testid="button-refresh-recommendations"
              title={!resumeText ? 'Re-analyze a resume in this session to refresh matches' : 'Refresh matches'}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[11px] font-bold transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {recom.isPending ? <LoaderCircle size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {!resumeText ? 'Refresh after analysis' : 'Refresh matches'}
            </button>
          </div>
          {recom.isError && <InlineError retry={refreshRecommendations} />}
          <div className="mt-4 space-y-3">
            {recommendations.slice(0, 3).map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                saved={Boolean(local.interactions[match.id]?.includes('saved'))}
                applied={Boolean(local.interactions[match.id]?.includes('applied'))}
                onSave={() => act(match, 'saved')}
                onApply={() => act(match, 'applied')}
                onView={() => act(match, 'viewed')}
              />
            ))}
            {!recommendations.length && <EmptySmall text="Recommendations will appear after your first resume analysis." />}
          </div>
        </section>
      </div>

      <RecentActivityCard activityLog={local.activityLog} recentTitles={recentTitles} />
    </div>
  );
}
