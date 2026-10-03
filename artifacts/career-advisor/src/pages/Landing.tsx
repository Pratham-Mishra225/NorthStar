import { Link } from 'wouter';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  FileCheck2,
  FileText,
  Layers3,
  Lightbulb,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { useGetDashboard } from '@ai-career-advisor/api-client';
import { InlineError } from '@/components/common/ErrorState';
import { SkeletonRows } from '@/components/common/SkeletonCard';

export function Landing() {
  const dashboard = useGetDashboard();
  const ready = dashboard.data?.readiness;
  const resumeSkills = dashboard.data?.skills ?? [];
  const roleSkills = dashboard.data?.targetRole?.skills ?? [];
  const demoSignals = (resumeSkills.length || roleSkills.length)
    ? [
      ...resumeSkills.slice(0, 2).map((skill) => ({
        name: skill.name,
        value: Math.round((skill.confidence ?? 0) * 100),
        label: 'Mentioned in demo resume',
      })),
      ...roleSkills
        .filter((required) => !resumeSkills.some((skill) => skill.name.toLowerCase() === required.name.toLowerCase()))
        .slice(0, 1)
        .map((skill) => ({ name: skill.name, value: 0, label: 'Not found in demo resume' })),
    ]
    : [];

  return (
    <div>
      <section className="mx-auto grid max-w-[1260px] gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-16">
        <div className="page-in">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[.055] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.12em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> A more useful kind of career advice
          </div>
          <h1 className="max-w-[670px] text-[clamp(2.8rem,6vw,5.1rem)] font-extrabold leading-[1.04] tracking-[-.065em]">
            Your next role, <span className="text-primary">with a reason.</span>
          </h1>
          <p className="mt-6 max-w-[530px] text-[17px] leading-8 text-muted-foreground">
            See how your resume lines up with a role, what evidence supports the match, and which small steps could move you forward.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/analyze"
              data-testid="link-start-analysis"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90"
            >
              Start with your resume <ArrowRight size={17} />
            </Link>
            <Link
              href="/jobs"
              data-testid="link-explore-opportunities"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3.5 text-sm font-bold transition-colors hover:bg-secondary"
            >
              Explore opportunities
            </Link>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            Your resume text is used for this request only—not stored by the demo API.
          </p>
          <div className="mt-11 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-primary" /> Evidence-led skill insights
            </span>
            <span className="flex items-center gap-2">
              <FileCheck2 size={15} className="text-primary" /> ATS feedback you can act on
            </span>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-5 rounded-[32px] bg-[radial-gradient(ellipse_at_45%_45%,rgba(34,115,92,.12),transparent_68%)]" />
          <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 soft-shadow sm:p-8">
            <div className="flex items-start justify-between border-b border-border pb-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.13em] text-muted-foreground">Your readiness snapshot</p>
                <h2 className="mt-2 text-xl font-bold">{dashboard.data?.targetRole.name ?? 'Data Analyst'}</h2>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">DEMO DATASET</span>
            </div>
            {dashboard.isLoading ? (
              <SkeletonRows />
            ) : dashboard.isError ? (
              <InlineError retry={() => dashboard.refetch()} />
            ) : (
              <div className="grid gap-7 pt-6 sm:grid-cols-[170px_1fr] sm:items-center">
                <div
                  className="mx-auto grid h-40 w-40 place-items-center rounded-full"
                  style={{ background: `conic-gradient(hsl(var(--primary)) ${ready ?? 0}%, hsl(var(--secondary)) 0)` }}
                >
                  <div className="grid h-[132px] w-[132px] place-items-center rounded-full bg-card text-center">
                    <div>
                      <div className="text-[38px] font-extrabold leading-none tracking-[-.07em]">
                        {ready ?? '—'}
                        <span className="text-base">%</span>
                      </div>
                      <div className="mt-2 text-[11px] font-medium text-muted-foreground">role readiness</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-sm leading-6 text-muted-foreground">See where your resume aligns and which skills to build next.</p>
                  {['Skills the role asks for', 'Resume clarity & ATS signals', 'Relevant demo opportunities'].map((item, i) => (
                    <div key={item} className="flex items-center gap-3 text-[13px] font-semibold">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-secondary text-primary">
                        {[<Target size={14} />, <FileText size={14} />, <BriefcaseBusiness size={14} />][i]}
                      </span>
                      {item}
                      <Check size={14} className="ml-auto text-primary" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-7 flex items-center gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground">
              <Lightbulb size={14} className="text-amber-600" /> No opaque score: every insight is tied to resume evidence.
            </div>
          </div>
        </div>
      </section>
      <section className="border-y border-border bg-[#f4f7f6]">
        <div className="mx-auto grid max-w-[1260px] gap-8 px-5 py-12 sm:px-8 md:grid-cols-[.8fr_1.2fr] md:items-center md:py-16">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.13em] text-primary">The process</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight">Less guessing.<br />More useful evidence.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['01', 'Choose a direction', 'Pick a role that feels worth exploring.'],
              ['02', 'See what aligns', 'Compare your resume evidence to role skills.'],
              ['03', 'Take a next step', 'Find a focused project or demo opportunity.'],
            ].map(([num, title, copy]) => (
              <div key={num} className="border-l-2 border-primary/30 pl-4">
                <div className="font-mono text-[11px] text-primary">{num}</div>
                <h3 className="mt-2 text-base font-bold">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1260px] px-5 py-14 sm:px-8 sm:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.13em] text-primary">Built to be transparent</p>
            <h2 className="mt-2 text-3xl font-bold">A coach that shows its work.</h2>
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-primary" data-testid="link-view-workspace">
            View the workspace <ArrowRight size={15} />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf3ef] text-primary">
                <Layers3 size={19} />
              </span>
              <div>
                <h3 className="font-bold">Skill fit, with context</h3>
                <p className="text-xs text-muted-foreground">Signals from the sample resume, matched to its selected role.</p>
              </div>
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">Alex Sharma · demo resume</p>
            <div className="mt-4 space-y-4">
              {dashboard.isLoading ? (
                <p className="text-xs text-muted-foreground">Loading sample signals…</p>
              ) : demoSignals.length ? (
                demoSignals.map(({ name, value, label }) => (
                  <div key={name}>
                    <div className="mb-1.5 flex justify-between gap-4 text-xs">
                      <span className="font-semibold">{name}</span>
                      <span className="text-right text-muted-foreground">{label}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Sample signals aren't available right now.</p>
              )}
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-2xl bg-[#193d35] p-6 text-white sm:p-8">
            <div>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-[#a8d7c3]">
                <Activity size={19} />
              </span>
              <h3 className="mt-6 max-w-[250px] text-[25px] font-bold leading-tight">Progress that stays yours.</h3>
              <p className="mt-3 max-w-[300px] text-sm leading-6 text-white/65">
                Your demo activity lives in this browser. A viewed or saved role is not an application.
              </p>
            </div>
            <Link href="/reports" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#b7ddcd]" data-testid="link-see-progress">
              See your progress <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
