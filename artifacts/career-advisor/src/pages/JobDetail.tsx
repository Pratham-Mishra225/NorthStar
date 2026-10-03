import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import {
  ArrowLeft,
  Bookmark,
  Check,
  Target,
  ChevronDown,
  CheckCircle2,
  Clock3,
} from 'lucide-react';
import { useGetJob, useGetDashboard, getGetJobQueryKey } from '@ai-career-advisor/api-client';
import type { LocalState, ActivityAction } from '@/types/career';
import { SkeletonCard } from '@/components/common/SkeletonCard';
import { ErrorState } from '@/components/common/ErrorState';
import { formatMoney } from '@/utils/formatters';

interface JobDetailProps {
  local: LocalState;
  addInteraction: (id: string, action: ActivityAction) => void;
}

export function JobDetail({ local, addInteraction }: JobDetailProps) {
  const { jobId = '' } = useParams<{ jobId: string }>();
  const jobQuery = useGetJob(jobId, { query: { enabled: Boolean(jobId), queryKey: getGetJobQueryKey(jobId) } });
  const dashboard = useGetDashboard(
    local.analysis
      ? { roleId: local.analysis.targetRole.id }
      : local.targetRoleId
      ? { roleId: local.targetRoleId }
      : undefined
  );
  const [showReasoning, setShowReasoning] = useState(true);
  const job = jobQuery.data;

  useEffect(() => {
    if (job) addInteraction(job.id, 'viewed');
  }, [job?.id]);

  const act = (action: ActivityAction) => {
    if (!job) return;
    addInteraction(job.id, action);
  };

  if (jobQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded bg-secondary" />
        <SkeletonCard />
      </div>
    );
  }

  if (jobQuery.isError || !job) {
    return <ErrorState title="This demo opportunity isn't available" retry={() => jobQuery.refetch()} />;
  }

  const saved = Boolean(local.interactions[job.id]?.includes('saved'));
  const applied = Boolean(local.interactions[job.id]?.includes('applied'));
  const matched = (local.analysis?.recommendations ?? dashboard.data?.recommendations ?? []).find((r) => r.id === job.id);

  return (
    <div className="mx-auto max-w-[1000px]">
      <Link href="/jobs" data-testid="link-back-to-jobs" className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary">
        <ArrowLeft size={14} /> All opportunities
      </Link>
      <div className="overflow-hidden rounded-2xl border border-border bg-card soft-shadow">
        <div className="border-b border-border bg-[#f4f7f6] p-6 sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground">
                {job.company.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[.14em] text-primary">Synthetic demo opportunity</span>
                <h1 className="mt-1 text-3xl font-extrabold">{job.title}</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {job.company} · {job.city} · {job.workMode}
                </p>
              </div>
            </div>
            <span className="rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-bold text-muted-foreground">
              Not a live vacancy
            </span>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {[job.category, job.jobType, job.experienceLevel].map((t) => (
              <span key={t} className="rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-semibold">
                {t}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => act('saved')}
              data-testid="button-detail-save"
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold ${
                saved ? 'bg-primary/10 text-primary' : 'border border-border bg-card hover:bg-secondary'
              }`}
            >
              <Bookmark size={14} />
              {saved ? 'Saved' : 'Save opportunity'}
            </button>
            <button
              type="button"
              disabled={applied}
              onClick={() => act('applied')}
              data-testid="button-detail-applied"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:bg-primary/10 disabled:text-primary"
            >
              <Check size={14} />
              {applied ? 'Marked applied' : 'Mark as applied'}
            </button>
            <span className="text-[10px] text-muted-foreground">Your action only—no application is sent.</span>
          </div>
        </div>
        <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_300px]">
          <div>
            <h2 className="text-lg font-bold">About this opportunity</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{job.description}</p>
            <h3 className="mt-8 text-base font-bold">Skills this role asks for</h3>
            <p className="mt-1 text-xs text-muted-foreground">Requirements, not claims about your proficiency.</p>
            <div className="mt-4 space-y-2">
              {(job.skills ?? []).map((skill) => (
                <div key={skill.name} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <div>
                    <span className="text-sm font-semibold">{skill.name}</span>
                    <span className="ml-2 text-[10px] text-muted-foreground">{skill.priority} priority</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{skill.weight}% weight</span>
                </div>
              ))}
            </div>
          </div>
          <aside className="space-y-4">
            <div className="rounded-xl border border-border p-4">
              <p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">Compensation example</p>
              <p className="mt-2 text-lg font-extrabold">
                {job.salary?.currency} {formatMoney(job.salary?.min)}–{formatMoney(job.salary?.max)}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">Demo dataset estimate · annual</p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/[.04] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.12em] text-primary">Your role fit</p>
                  <p className="mt-1 text-2xl font-extrabold">
                    {matched?.matchScore ?? '—'}
                    {matched && <span className="text-sm">%</span>}
                  </p>
                </div>
                <Target size={20} className="text-primary" />
              </div>
              {matched ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowReasoning(!showReasoning)}
                    data-testid="button-toggle-reasoning"
                    className="mt-3 flex w-full items-center justify-between border-t border-primary/10 pt-3 text-[11px] font-bold text-primary"
                  >
                    Why this match <ChevronDown size={14} className={showReasoning ? 'rotate-180' : ''} />
                  </button>
                  {showReasoning && (
                    <ul className="mt-2 space-y-2">
                      {(matched.explanation ?? []).map((reason, i) => (
                        <li key={i} className="flex gap-2 text-[11px] leading-5 text-muted-foreground">
                          <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-primary" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(matched.matchedSkills ?? []).slice(0, 5).map((s) => (
                      <span key={s} className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-semibold text-primary">
                        {s}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-2 text-xs leading-5 text-muted-foreground">Analyze a resume to see an explainable fit for this role.</p>
              )}
            </div>
            <div className="rounded-xl bg-secondary/70 p-4">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Clock3 size={14} className="text-primary" /> Added to demo dataset
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">
                {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Date not provided'}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
