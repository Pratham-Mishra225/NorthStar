import { useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'wouter';
import { ShieldCheck, Search, Filter, MapPin, Bookmark } from 'lucide-react';
import { useGetJobs, useGetDashboard } from '@ai-career-advisor/api-client';
import type { Job } from '@ai-career-advisor/api-client';
import type { LocalState, ActivityAction } from '@/types/career';
import { PageHeading } from '@/components/common/PageHeading';
import { FilterSelect } from '@/components/jobs/FilterSelect';
import { SkeletonCard } from '@/components/common/SkeletonCard';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { formatMoney } from '@/utils/formatters';

interface JobsProps {
  local: LocalState;
  addInteraction: (id: string, action: ActivityAction) => void;
}

export function Jobs({ local, addInteraction }: JobsProps) {
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [jobType, setJobType] = useState('');
  const [minimumMatch, setMinimumMatch] = useState(0);
  const [jobLimit, setJobLimit] = useState(60);
  const [sort, setSort] = useState<'best-match' | 'highest-match' | 'newest'>('best-match');

  const params = useMemo(
    () => ({
      ...(query ? { q: query } : {}),
      ...(category ? { category } : {}),
      ...(location ? { location } : {}),
      ...(workMode ? { workMode } : {}),
      ...(jobType ? { jobType } : {}),
      sort,
      limit: jobLimit,
    }),
    [query, category, location, workMode, jobType, sort, jobLimit]
  );

  const jobs = useGetJobs(params);
  const dashboard = useGetDashboard(
    local.analysis
      ? { roleId: local.analysis.targetRole.id }
      : local.targetRoleId
      ? { roleId: local.targetRoleId }
      : undefined
  );

  const rankedMatches = local.analysis?.recommendations ?? dashboard.data?.recommendations ?? [];
  const matchById = useMemo(() => new Map(rankedMatches.map((job) => [job.id, job])), [rankedMatches]);

  const orderedJobs = useMemo(() => {
    const result = (jobs.data ?? []).filter((job) => {
      const score = matchById.get(job.id)?.matchScore ?? 0;
      return minimumMatch === 0 || score >= minimumMatch;
    });

    if (sort === 'best-match') {
      result.sort((a, b) => {
        const matchA = matchById.get(a.id);
        const matchB = matchById.get(b.id);
        return (
          (matchB?.matchScore ?? -1) - (matchA?.matchScore ?? -1) ||
          (matchB?.matchedSkills.length ?? 0) - (matchA?.matchedSkills.length ?? 0) ||
          b.createdAt.localeCompare(a.createdAt) ||
          a.title.localeCompare(b.title)
        );
      });
    } else if (sort === 'highest-match') {
      result.sort(
        (a, b) =>
          (matchById.get(b.id)?.matchScore ?? -1) - (matchById.get(a.id)?.matchScore ?? -1) ||
          a.title.localeCompare(b.title)
      );
    }
    return result;
  }, [jobs.data, sort, matchById, minimumMatch]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setQuery(q);
  };

  const act = (job: Job, action: ActivityAction) => {
    addInteraction(job.id, action);
  };

  const categories = Array.from(new Set((jobs.data || []).map((j) => j.category))).filter(Boolean);
  const locations = Array.from(new Set((jobs.data || []).map((j) => j.city))).filter(Boolean);
  const modes = Array.from(new Set((jobs.data || []).map((j) => j.workMode))).filter(Boolean);
  const types = Array.from(new Set((jobs.data || []).map((j) => j.jobType))).filter(Boolean);

  return (
    <div>
      <PageHeading
        eyebrow="Curated opportunities"
        title="Find a place to practice."
        subtitle="Explore synthetic roles selected to help you build evidence and test a direction. These are not live vacancies."
      />
      <div className="mb-6 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/[.04] px-4 py-3 text-xs text-muted-foreground">
        <ShieldCheck size={16} className="shrink-0 text-primary" />
        <span>
          <strong className="text-foreground">Demo dataset</strong> · Listings are learning examples, not open jobs or application links.
        </span>
      </div>
      <div className="mb-5 rounded-2xl border border-border bg-card p-4 soft-shadow">
        <form onSubmit={submit} className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              data-testid="input-job-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, company, or skill"
              className="w-full rounded-lg border border-input bg-background py-3 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <button
            type="submit"
            data-testid="button-search-jobs"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-xs font-bold text-primary-foreground hover:opacity-90"
          >
            <Search size={14} /> Search
          </button>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">
            <Filter size={13} /> Filters
          </span>
          <FilterSelect id="category" label="All categories" value={category} options={categories} onChange={setCategory} />
          <FilterSelect id="location" label="Any location" value={location} options={locations} onChange={setLocation} />
          <FilterSelect id="work-mode" label="Any work mode" value={workMode} options={modes} onChange={setWorkMode} />
          <FilterSelect id="job-type" label="Any job type" value={jobType} options={types} onChange={setJobType} />
          <select
            data-testid="select-minimum-match"
            aria-label="Minimum match score"
            value={minimumMatch}
            onChange={(e) => setMinimumMatch(Number(e.target.value))}
            className="rounded-lg border border-input bg-background px-3 py-2 text-[11px] font-semibold outline-none focus:border-primary"
          >
            <option value={0}>Any match</option>
            <option value={40}>40%+ match</option>
            <option value={60}>60%+ match</option>
            <option value={80}>80%+ match</option>
          </select>
          <select
            data-testid="select-sort-jobs"
            aria-label="Sort opportunities"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="ml-auto rounded-lg border border-input bg-background px-3 py-2 text-[11px] font-semibold outline-none focus:border-primary"
          >
            <option value="best-match">Best match</option>
            <option value="highest-match">Highest match</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      {jobs.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : jobs.isError ? (
        <ErrorState title="Opportunities aren't available right now" retry={() => jobs.refetch()} />
      ) : !orderedJobs.length ? (
        <EmptyState
          icon={<Search size={22} />}
          title="No matches for these filters"
          body="Try a lower match threshold or clear a filter to see more demo opportunities."
          action={
            <button
              type="button"
              onClick={() => {
                setQ('');
                setQuery('');
                setCategory('');
                setLocation('');
                setWorkMode('');
                setJobType('');
                setMinimumMatch(0);
                setJobLimit(60);
              }}
              className="rounded-lg border border-border px-4 py-2.5 text-xs font-bold hover:bg-secondary"
              data-testid="button-clear-filters"
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
            <span data-testid="text-jobs-count">{orderedJobs.length} opportunities shown</span>
            <span>Showing synthetic listings only</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {orderedJobs.map((job) => {
              const isSaved = Boolean(local.interactions[job.id]?.includes('saved'));
              const isApplied = Boolean(local.interactions[job.id]?.includes('applied'));
              const match = matchById.get(job.id);
              const matchScore = match?.matchScore;
              return (
                <article
                  key={job.id}
                  data-testid={`card-job-${job.id}`}
                  className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md sm:p-6"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-sm font-extrabold text-primary">
                      {job.company.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/jobs/${job.id}`}
                        onClick={() => act(job, 'viewed')}
                        data-testid={`link-title-${job.id}`}
                        className="line-clamp-1 text-base font-bold tracking-tight group-hover:text-primary"
                      >
                        {job.title}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">{job.company}</p>
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-secondary px-2 py-1 text-[9px] font-bold text-muted-foreground">
                        {job.source || 'Demo'}
                      </span>
                      {matchScore !== undefined && (
                        <div className="mt-2 text-[10px] font-bold text-primary">{matchScore}% fit</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} />
                      {job.city}
                    </span>
                    <span>{job.workMode}</span>
                    <span>{job.jobType}</span>
                    <span>{job.experienceLevel}</span>
                  </div>
                  <p className="mt-4 line-clamp-2 text-xs leading-5 text-muted-foreground">{job.description}</p>
                  {match ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[.08em] text-primary">Matched skills</p>
                        <div className="flex flex-wrap gap-1">
                          {(match.matchedSkills ?? []).slice(0, 4).map((skill) => (
                            <span key={skill} className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-semibold text-primary">
                              {skill}
                            </span>
                          ))}
                        </div>
                        {!(match.matchedSkills ?? []).length && (
                          <span className="text-[10px] text-muted-foreground">No listed skills detected</span>
                        )}
                      </div>
                      <div>
                        <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[.08em] text-muted-foreground">Skills to build</p>
                        <div className="flex flex-wrap gap-1">
                          {(match.missingSkills ?? []).slice(0, 4).map((skill) => (
                            <span key={skill} className="rounded-full border border-border px-2 py-1 text-[9px] text-muted-foreground">
                              {skill}
                            </span>
                          ))}
                        </div>
                        {!(match.missingSkills ?? []).length && (
                          <span className="text-[10px] text-muted-foreground">No listed gaps</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[.08em] text-muted-foreground">Listed role skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(job.skills ?? []).slice(0, 4).map((skill) => (
                          <span key={skill.name} className="rounded-full border border-border px-2.5 py-1 text-[10px] font-medium">
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                    <span className="text-xs font-bold">
                      {job.salary?.currency} {formatMoney(job.salary?.min)}–{formatMoney(job.salary?.max)}{' '}
                      <span className="font-normal text-muted-foreground">/ year</span>
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => act(job, 'saved')}
                        data-testid={`button-save-job-${job.id}`}
                        className={`rounded-lg border px-3 py-2 text-[10px] font-bold ${
                          isSaved ? 'border-primary/20 bg-primary/10 text-primary' : 'border-border hover:bg-secondary'
                        }`}
                      >
                        <Bookmark size={13} className="inline" /> {isSaved ? 'Saved' : 'Save'}
                      </button>
                      <Link
                        href={`/jobs/${job.id}`}
                        onClick={() => act(job, 'viewed')}
                        data-testid={`link-job-detail-${job.id}`}
                        className="rounded-lg bg-primary px-3 py-2 text-[10px] font-bold text-primary-foreground hover:opacity-90"
                      >
                        View role
                      </Link>
                    </div>
                  </div>
                  {isApplied && <p className="mt-2 text-[10px] text-muted-foreground">Marked applied by you · no application was sent</p>}
                </article>
              );
            })}
          </div>
          {(jobs.data?.length ?? 0) === jobLimit && jobLimit < 300 && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setJobLimit((current) => Math.min(300, current + 60))}
                data-testid="button-load-more-jobs"
                className="rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-bold hover:bg-secondary"
              >
                Show more demo opportunities
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
