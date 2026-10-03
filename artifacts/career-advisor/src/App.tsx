import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Route, Switch, Link, useLocation, useParams, Router as WouterRouter } from 'wouter';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth/mammoth.browser';
import {
  Activity, ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, Bookmark,
  BriefcaseBusiness, Check, CheckCircle2, ChevronDown, CircleHelp, Clock3, Compass,
  FileCheck2, FileText, Filter, Gauge, Layers3, Lightbulb, LoaderCircle, MapPin,
  Menu, Search, ShieldCheck, Sparkles, Target, Upload, X,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  getGetDashboardQueryKey, getGetReportsQueryKey, getGetJobQueryKey,
  getGetRoleQueryKey, useAnalyzeResume, useGetDashboard, useGetJobs, useGetJob,
  useGetRecommendations, useGetReports, useGetRole, useGetRoles, useHealthCheck,
} from '@ai-career-advisor/api-client';
import type { Job, JobMatch, ResumeAnalysis } from '@ai-career-advisor/api-client';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
const DEMO_RESUME = `Maya Chen
maya.chen@email.com | Portland, OR | portfolio.example

EDUCATION
B.S. Information Systems, Portland State University — 2025

PROJECTS
Product analytics dashboard | SQL, Python, Tableau
Built a dashboard to explore 18,000 sample retail events. Used SQL to clean and model data, then created Tableau views to explain weekly retention patterns to a five-person project team.

EXPERIENCE
Student Research Assistant | PSU Digital Lab
Organized survey responses and documented repeatable data-cleaning steps. Presented findings to faculty and collaborated on a small usability study.

SKILLS
SQL, Python, Tableau, Excel, data visualization, research, communication, Figma`;

const ATS_BREAKDOWN_LABELS: Record<string, string> = {
  keywords: 'Keyword score',
  skills: 'Skill match',
  sections: 'Sections',
  projects: 'Projects / experience',
  contact: 'Contact information',
  formatting: 'Formatting',
};

type LocalState = {
  targetRoleId: string;
  analysis: ResumeAnalysis | null;
  interactions: Record<string, string[]>;
  activityLog: Array<{ jobId: string; action: 'viewed' | 'saved' | 'applied'; timestamp: string }>;
};
const loadState = (): LocalState => {
  try {
    const stored = localStorage.getItem('career-advisor-demo-v1');
    if (stored) {
      const value = JSON.parse(stored) as Partial<LocalState>;
      return {
        targetRoleId: value.targetRoleId || '',
        analysis: value.analysis || null,
        interactions: value.interactions || {},
        activityLog: Array.isArray(value.activityLog) ? value.activityLog : [],
      };
    }
  } catch { /* Start with a clean demo workspace if browser storage is unavailable. */ }
  return { targetRoleId: '', analysis: null, interactions: {}, activityLog: [] };
};

function App() {
  const [local, setLocal] = useState<LocalState>(loadState);
  const [resumeText, setResumeText] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const persist = (next: LocalState) => {
    setLocal(next);
    try { localStorage.setItem('career-advisor-demo-v1', JSON.stringify(next)); } catch { /* Storage is optional. */ }
  };
  const addInteraction = (jobId: string, action: 'viewed' | 'saved' | 'applied') => {
    const current = local.interactions[jobId] || [];
    const alreadyActive = current.includes(action);
    if (action === 'saved' && alreadyActive) {
      persist({
        ...local,
        interactions: { ...local.interactions, [jobId]: current.filter((item) => item !== action) },
      });
      return;
    }
    if (alreadyActive) return;
    persist({
      ...local,
      interactions: { ...local.interactions, [jobId]: [...current, action] },
      activityLog: [...local.activityLog, { jobId, action, timestamp: new Date().toISOString() }],
    });
  };
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Shell menuOpen={mobileMenu} setMenuOpen={setMobileMenu}>
          <Switch>
            <Route path="/" component={() => <Landing />} />
            <Route path="/analyze" component={() => <AnalyzePage local={local} persist={persist} setResumeText={setResumeText} />} />
            <Route path="/dashboard" component={() => <DashboardPage local={local} resumeText={resumeText} persist={persist} addInteraction={addInteraction} />} />
            <Route path="/jobs" component={() => <JobsPage local={local} addInteraction={addInteraction} />} />
            <Route path="/jobs/:jobId" component={() => <JobDetailPage local={local} addInteraction={addInteraction} />} />
            <Route path="/reports" component={() => <ReportsPage local={local} />} />
            <Route component={NotFound} />
          </Switch>
        </Shell>
      </WouterRouter>
    </QueryClientProvider>
  );
}

function Shell({ children, menuOpen, setMenuOpen }: { children: ReactNode; menuOpen: boolean; setMenuOpen: (v: boolean) => void }) {
  const [location] = useLocation();
  const health = useHealthCheck();
  const links = [
    { href: '/dashboard', label: 'Overview', icon: Gauge },
    { href: '/jobs', label: 'Opportunities', icon: BriefcaseBusiness },
    { href: '/reports', label: 'Progress', icon: BarChart3 },
  ];
  const onLanding = location === '/';
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-5 sm:px-8">
          <Link href="/" data-testid="link-brand" className="group flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Compass size={19} strokeWidth={2.4} /></span>
            <span className="text-[15px] font-bold tracking-[-.04em]">AI Career<span className="font-medium text-muted-foreground"> Advisor</span></span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {links.map(({ href, label }) => <Link key={href} href={href} data-testid={`link-nav-${label.toLowerCase()}`} className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-secondary ${location === href || (href === '/jobs' && location.startsWith('/jobs/')) ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}>{label}</Link>)}
            <Link href="/analyze" data-testid="link-nav-analyze" className={`ml-2 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-all hover:-translate-y-0.5 ${location === '/analyze' ? 'bg-primary/10 text-primary' : 'bg-primary text-primary-foreground hover:opacity-90'}`}><Sparkles size={15} /> Analyze resume</Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-[11px] font-medium text-muted-foreground sm:flex" data-testid="status-api">
              <span className={`h-1.5 w-1.5 rounded-full ${health.isError ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              {health.isLoading ? 'Connecting' : health.isError ? 'Demo mode' : 'Demo dataset'}
            </span>
            <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg border border-border p-2 md:hidden" data-testid="button-mobile-menu" aria-label="Toggle navigation">{menuOpen ? <X size={19} /> : <Menu size={19} />}</button>
          </div>
        </div>
        {menuOpen && <nav className="grid gap-1 border-t border-border px-5 py-3 md:hidden">{[...links, { href: '/analyze', label: 'Analyze resume', icon: Sparkles }].map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold hover:bg-secondary"><Icon size={17} />{label}</Link>)}</nav>}
      </header>
      <main className={`${onLanding ? 'max-w-none' : 'mx-auto max-w-[1260px] px-5 pb-16 pt-8 sm:px-8 sm:pt-10'} page-in`}>{children}</main>
      <footer className="mx-auto flex max-w-[1260px] flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-5 text-[11px] text-muted-foreground sm:px-8">
        <span>AI Career Advisor · Built for clearer next steps.</span>
        <span className="inline-flex items-center gap-1.5"><CircleHelp size={13} /> Demo dataset · No live vacancies.</span>
      </footer>
    </div>
  );
}

function Landing() {
  const dashboard = useGetDashboard();
  const ready = dashboard.data?.readiness;
  const resumeSkills = dashboard.data?.skills ?? [];
  const roleSkills = dashboard.data?.targetRole?.skills ?? [];
  const demoSignals = (resumeSkills.length || roleSkills.length)
    ? [
      ...resumeSkills.slice(0, 2).map((skill) => ({
        name: skill.name,
        value: Math.round((skill.confidence ?? 0) * 100),
        label: "Mentioned in demo resume",
      })),
      ...roleSkills
        .filter((required) => !resumeSkills.some((skill) => skill.name.toLowerCase() === required.name.toLowerCase()))
        .slice(0, 1)
        .map((skill) => ({ name: skill.name, value: 0, label: "Not found in demo resume" })),
    ]
    : [];
  return (
    <div>
      <section className="mx-auto grid max-w-[1260px] gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-16">
        <div className="page-in">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[.055] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.12em] text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> A more useful kind of career advice</div>
          <h1 className="max-w-[670px] text-[clamp(2.8rem,6vw,5.1rem)] font-extrabold leading-[1.04] tracking-[-.065em]">Your next role, <span className="text-primary">with a reason.</span></h1>
          <p className="mt-6 max-w-[530px] text-[17px] leading-8 text-muted-foreground">See how your resume lines up with a role, what evidence supports the match, and which small steps could move you forward.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/analyze" data-testid="link-start-analysis" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90">Start with your resume <ArrowRight size={17} /></Link>
            <Link href="/jobs" data-testid="link-explore-opportunities" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3.5 text-sm font-bold transition-colors hover:bg-secondary">Explore opportunities</Link>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">Your resume text is used for this request only—not stored by the demo API.</p>
          <div className="mt-11 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-primary" /> Evidence-led skill insights</span><span className="flex items-center gap-2"><FileCheck2 size={15} className="text-primary" /> ATS feedback you can act on</span>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-5 rounded-[32px] bg-[radial-gradient(ellipse_at_45%_45%,rgba(34,115,92,.12),transparent_68%)]" />
          <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 soft-shadow sm:p-8">
            <div className="flex items-start justify-between border-b border-border pb-5">
              <div><p className="text-[11px] font-bold uppercase tracking-[.13em] text-muted-foreground">Your readiness snapshot</p><h2 className="mt-2 text-xl font-bold">{dashboard.data?.targetRole.name ?? 'Data Analyst'}</h2></div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">DEMO DATASET</span>
            </div>
            {dashboard.isLoading ? <SkeletonRows /> : dashboard.isError ? <InlineError retry={() => dashboard.refetch()} /> : <div className="grid gap-7 pt-6 sm:grid-cols-[170px_1fr] sm:items-center">
              <div className="mx-auto grid h-40 w-40 place-items-center rounded-full" style={{ background: `conic-gradient(hsl(var(--primary)) ${ready ?? 0}%, hsl(var(--secondary)) 0)` }}>
                <div className="grid h-[132px] w-[132px] place-items-center rounded-full bg-card text-center"><div><div className="text-[38px] font-extrabold leading-none tracking-[-.07em]">{ready ?? '—'}<span className="text-base">%</span></div><div className="mt-2 text-[11px] font-medium text-muted-foreground">role readiness</div></div></div>
              </div>
              <div className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">See where your resume aligns and which skills to build next.</p>
                {['Skills the role asks for', 'Resume clarity & ATS signals', 'Relevant demo opportunities'].map((item, i) => <div key={item} className="flex items-center gap-3 text-[13px] font-semibold"><span className="grid h-7 w-7 place-items-center rounded-lg bg-secondary text-primary">{[<Target size={14} />, <FileText size={14} />, <BriefcaseBusiness size={14} />][i]}</span>{item}<Check size={14} className="ml-auto text-primary" /></div>)}
              </div>
            </div>}
            <div className="mt-7 flex items-center gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground"><Lightbulb size={14} className="text-amber-600" /> No opaque score: every insight is tied to resume evidence.</div>
          </div>
        </div>
      </section>
      <section className="border-y border-border bg-[#f4f7f6]">
        <div className="mx-auto grid max-w-[1260px] gap-8 px-5 py-12 sm:px-8 md:grid-cols-[.8fr_1.2fr] md:items-center md:py-16">
          <div><p className="text-[11px] font-bold uppercase tracking-[.13em] text-primary">The process</p><h2 className="mt-3 text-3xl font-bold leading-tight">Less guessing.<br />More useful evidence.</h2></div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[['01', 'Choose a direction', 'Pick a role that feels worth exploring.'], ['02', 'See what aligns', 'Compare your resume evidence to role skills.'], ['03', 'Take a next step', 'Find a focused project or demo opportunity.']].map(([num, title, copy]) => <div key={num} className="border-l-2 border-primary/30 pl-4"><div className="font-mono text-[11px] text-primary">{num}</div><h3 className="mt-2 text-base font-bold">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{copy}</p></div>)}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1260px] px-5 py-14 sm:px-8 sm:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="text-[11px] font-bold uppercase tracking-[.13em] text-primary">Built to be transparent</p><h2 className="mt-2 text-3xl font-bold">A coach that shows its work.</h2></div><Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-primary" data-testid="link-view-workspace">View the workspace <ArrowRight size={15} /></Link></div>
        <div className="grid gap-4 md:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf3ef] text-primary"><Layers3 size={19} /></span><div><h3 className="font-bold">Skill fit, with context</h3><p className="text-xs text-muted-foreground">Signals from the sample resume, matched to its selected role.</p></div></div><p className="mt-5 text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">Alex Sharma · demo resume</p><div className="mt-4 space-y-4">{dashboard.isLoading ? <p className="text-xs text-muted-foreground">Loading sample signals…</p> : demoSignals.length ? demoSignals.map(({ name, value, label }) => <div key={name}><div className="mb-1.5 flex justify-between gap-4 text-xs"><span className="font-semibold">{name}</span><span className="text-right text-muted-foreground">{label}</span></div><div className="h-1.5 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} /></div></div>) : <p className="text-xs text-muted-foreground">Sample signals aren't available right now.</p>}</div></div>
          <div className="flex flex-col justify-between rounded-2xl bg-[#193d35] p-6 text-white sm:p-8"><div><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-[#a8d7c3]"><Activity size={19} /></span><h3 className="mt-6 max-w-[250px] text-[25px] font-bold leading-tight">Progress that stays yours.</h3><p className="mt-3 max-w-[300px] text-sm leading-6 text-white/65">Your demo activity lives in this browser. A viewed or saved role is not an application.</p></div><Link href="/reports" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#b7ddcd]" data-testid="link-see-progress">See your progress <ArrowUpRight size={15} /></Link></div>
        </div>
      </section>
    </div>
  );
}

function AnalyzePage({ local, persist, setResumeText }: { local: LocalState; persist: (s: LocalState) => void; setResumeText: (s: string) => void }) {
  const roles = useGetRoles();
  const analyze = useAnalyzeResume();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [filename, setFilename] = useState('resume.txt');
  const [roleId, setRoleId] = useState(local.targetRoleId);
  const [fileError, setFileError] = useState('');
  const roleDetail = useGetRole(roleId, { query: { enabled: Boolean(roleId), queryKey: getGetRoleQueryKey(roleId) } });
  const currentRole = roleDetail.data || roles.data?.find((r) => r.id === roleId);
  const onFile = async (file?: File) => {
    if (!file) return;
    const extension = file.name.toLowerCase().split('.').pop();
    if (!['pdf', 'docx', 'txt'].includes(extension || '')) { setFileError('Choose a PDF, DOCX, or TXT file.'); return; }
    if (file.size > 10 * 1024 * 1024) { setFileError('Choose a file smaller than 10 MB.'); return; }
    setFileError('');
    try {
      let extracted = '';
      if (extension === 'txt') extracted = await file.text();
      else if (extension === 'pdf') {
        const pdf = await getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
        const pages: string[] = [];
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const content = await page.getTextContent();
          pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
        }
        extracted = pages.join('\n');
        await pdf.destroy();
      } else {
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        extracted = result.value;
      }
      if (extracted.trim().length < 20) throw new Error('Text could not be extracted.');
      if (extracted.length > 100000) {
        setFileError('This file contains more than 100,000 characters. Paste a shorter resume section to analyze.');
        return;
      }
      setText(extracted); setFilename(file.name);
    } catch {
      setFileError(`We couldn't extract readable text from ${file.name}. Try another file or paste your resume text below.`);
    }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (text.trim().length < 20 || text.trim().length > 100000 || !roleId) return;
    analyze.mutate({ data: { filename, text: text.trim(), targetRoleId: roleId } }, {
      onSuccess: (result) => {
        setResumeText(text.trim());
        persist({ ...local, targetRoleId: roleId, analysis: result });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetReportsQueryKey() });
      },
    });
  };
  return (
    <div className="mx-auto max-w-[890px]">
      <PageHeading eyebrow="Resume analysis" title="Start with what's already there." subtitle="Choose a target role and share resume text. We’ll map the evidence, not make assumptions." />
      <div className="mb-6 flex gap-3 rounded-xl border border-primary/20 bg-primary/[.045] p-4 text-[13px] leading-5 text-muted-foreground"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary" /><span><strong className="text-foreground">Private by design.</strong> Resume text stays in this browser session and is sent only when you request analysis or refreshed matches. The demo API does not persist it, and browser storage keeps analysis results—not the resume text.</span></div>
      <form onSubmit={submit} className="space-y-5">
        <section className="rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-7">
          <div className="flex items-start gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-primary"><span className="text-sm font-bold">1</span></span><div><h2 className="text-lg font-bold">Pick a role to explore</h2><p className="mt-1 text-xs text-muted-foreground">Compare against the role’s listed skills and priorities.</p></div></div>
          <label className="mt-5 block text-xs font-bold text-foreground" htmlFor="role-select">Target role</label>
          <div className="relative mt-2">
            <select id="role-select" data-testid="select-target-role" value={roleId} onChange={(e) => setRoleId(e.target.value)} className="w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" required>
              <option value="">Select a role</option>{roles.data?.map((role) => <option key={role.id} value={role.id}>{role.name} · {role.category}</option>)}
            </select><ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
          {roles.isLoading && <p className="mt-2 text-xs text-muted-foreground">Loading role options…</p>}
          {roles.isError && <InlineError retry={() => roles.refetch()} />}
          {currentRole && <div className="mt-4 rounded-xl bg-secondary/70 p-4"><p className="text-xs leading-5 text-muted-foreground">{currentRole.description}</p><div className="mt-3 flex flex-wrap gap-2">{currentRole.skills.slice(0, 5).map((skill) => <span key={skill.name} className="rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-semibold">{skill.name}<span className="ml-1.5 text-muted-foreground">{skill.priority}</span></span>)}</div></div>}
        </section>
        <section className="rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-7">
          <div className="flex items-start gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-primary"><span className="text-sm font-bold">2</span></span><div><h2 className="text-lg font-bold">Add resume evidence</h2><p className="mt-1 text-xs text-muted-foreground">PDF and DOCX work when readable text can be extracted. You can always paste text.</p></div></div>
          <label htmlFor="resume-file" className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-primary/30 bg-[#f7faf9] px-5 py-7 text-center transition hover:border-primary hover:bg-primary/[.035]">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Upload size={19} /></span><span className="mt-3 text-sm font-bold">Choose a file</span><span className="mt-1 text-xs text-muted-foreground">PDF, DOCX, or TXT · text extraction is checked before analysis</span>
          </label>
          <input id="resume-file" data-testid="input-resume-file" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={(e) => void onFile(e.target.files?.[0])} className="sr-only" />
          {fileError && <div data-testid="status-file-error" className="mt-3 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-700">{fileError}</div>}
          <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">or paste text</div>
          <textarea data-testid="input-resume-text" aria-label="Resume text" value={text} onChange={(e) => { setText(e.target.value); setFilename('pasted-resume.txt'); }} rows={9} placeholder="Paste resume text here. Include projects, experience, education, and skills you want us to consider." className="w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm leading-6 outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/10" />
         <div className="mt-2 flex justify-between text-[11px] text-muted-foreground"><span>20–100,000 characters</span><span data-testid="text-resume-length">{text.length.toLocaleString()} characters</span></div>
          <button type="button" data-testid="button-use-demo-resume" onClick={() => { setText(DEMO_RESUME); setFilename('maya-chen-demo-resume.txt'); setFileError(''); }} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"><FileText size={14} /> Use a sample resume</button>
        </section>
        {analyze.isError && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" data-testid="status-analysis-error">Analysis couldn't be completed. Check the text and try again.</div>}
        {analyze.data && <AnalysisResult result={analyze.data} />}
        <button type="submit" disabled={analyze.isPending || text.trim().length < 20 || text.trim().length > 100000 || !roleId} data-testid="button-analyze-resume" className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
          {analyze.isPending ? <><LoaderCircle size={17} className="animate-spin" /> Reviewing resume evidence…</> : <>Analyze my role fit <ArrowRight size={17} /></>}
        </button>
      </form>
    </div>
  );
}

function AnalysisResult({ result }: { result: ResumeAnalysis }) {
  return <section className="rounded-2xl border border-primary/20 bg-primary/[.04] p-5 sm:p-7" data-testid="panel-analysis-results">
    <div className="flex items-start justify-between gap-4"><div><span className="text-[10px] font-bold uppercase tracking-[.14em] text-primary">Analysis ready</span><h2 className="mt-1 text-xl font-bold">{result.readiness}% readiness for {result.targetRole.name}</h2><p className="mt-1 text-xs text-muted-foreground">Signals found in {result.filename}; not a measure of your potential.</p></div><Link href="/dashboard" data-testid="link-analysis-dashboard" className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">Open workspace</Link></div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2"><div><h3 className="text-xs font-bold">Matched role skills</h3><div className="mt-2 flex flex-wrap gap-1.5">{result.matchedRoleSkills.map((skill) => <span key={skill} className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">{skill}</span>)}</div></div><div><h3 className="text-xs font-bold">Skills to build or demonstrate</h3><div className="mt-2 flex flex-wrap gap-1.5">{result.missingRoleSkills.map((skill) => <span key={skill.name} className="rounded-full border border-border bg-card px-2.5 py-1 text-[10px] text-muted-foreground">{skill.name}</span>)}</div></div></div>
  </section>;
}

function DashboardPage({ local, resumeText, persist, addInteraction }: { local: LocalState; resumeText: string; persist: (s: LocalState) => void; addInteraction: (id: string, action: 'viewed' | 'saved' | 'applied') => void }) {
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
  const act = (job: Job, action: 'viewed' | 'saved' | 'applied') => {
    addInteraction(job.id, action);
  };
  const matchAverage = recommendations.length
    ? Math.round(recommendations.reduce((sum, job) => sum + job.matchScore, 0) / recommendations.length)
    : null;
  const recentTitles = new Map(recommendations.map((job) => [job.id, job.title]));
  if (q.isLoading) return <DashboardSkeleton />;
  if (q.isError && !analysis) return <ErrorState title="We couldn't load your workspace" retry={() => q.refetch()} />;
  if (!data && !analysis) return <EmptyState icon={<Compass size={22} />} title="Your workspace starts with a role" body="Share your resume and choose a target role to see a clear, evidence-led view of your next steps." action={<Link href="/analyze" className="rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground">Analyze a resume</Link>} />;
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-4">
        <PageHeading eyebrow="Your workspace" title={analysis ? 'Your career workspace.' : `Good to see you${data?.name ? `, ${data.name.split(' ')[0]}` : ''}.`} subtitle={role ? `A practical look at your path toward ${role.name}.` : 'Your career readiness, with the reasoning in view.'} />
        <div className="mb-7 min-w-[220px]">
          <label htmlFor="dashboard-target-role" className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">Target role</label>
          <select id="dashboard-target-role" data-testid="select-dashboard-target-role" value={role?.id ?? ''} disabled={roles.isLoading || roleAnalysis.isPending || Boolean(analysis && !resumeText)} onChange={(event) => {
            const nextRoleId = event.target.value;
            if (!nextRoleId || nextRoleId === role?.id) return;
            if (analysis && resumeText) {
              roleAnalysis.mutate({ data: { filename: analysis.filename, text: resumeText, targetRoleId: nextRoleId } }, {
                onSuccess: (result) => {
                  persist({ ...local, targetRoleId: nextRoleId, analysis: result });
                  queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey({ roleId: nextRoleId }) });
                  queryClient.invalidateQueries({ queryKey: getGetReportsQueryKey() });
                },
              });
            } else {
              persist({ ...local, targetRoleId: nextRoleId });
            }
          }} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-xs font-semibold outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60">
            {roles.data?.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
          </select>
          {analysis && !resumeText && <p className="mt-1.5 max-w-[270px] text-[10px] leading-4 text-muted-foreground">Re-upload your resume to compare it with another role; resume text is not stored.</p>}
          {roleAnalysis.isError && <p className="mt-1.5 text-[10px] text-destructive">Could not re-analyze this resume for that role.</p>}
        </div>
        <span className="mb-7 rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">{analysis ? 'Your resume' : 'Demo profile · sample resume'}</span>
      </div>
      {q.isError && <InlineError retry={() => q.refetch()} />}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { key: 'readiness', label: 'Role readiness', value: `${readiness}%`, hint: 'Weighted listed skills', Icon: Gauge },
          { key: 'ats', label: 'ATS-style score', value: ats ? `${ats.overallScore}/100` : '—', hint: 'Explainable resume heuristic', Icon: FileCheck2 },
          { key: 'average-match', label: 'Average job match', value: matchAverage === null ? '—' : `${matchAverage}%`, hint: 'Across target-role listings', Icon: Target },
          { key: 'jobs-found', label: 'Jobs found', value: data?.jobsFound ?? 0, hint: 'Synthetic demo dataset', Icon: BriefcaseBusiness },
        ].map(({ key, label, value, hint, Icon }) => <div key={key} data-testid={`metric-dashboard-${key}`} className="rounded-2xl border border-border bg-card p-4 soft-shadow">
          <div className="flex items-center justify-between text-muted-foreground"><span className="text-[11px] font-semibold">{label}</span><Icon size={16} className="text-primary" /></div>
          <div className="mt-3 text-2xl font-extrabold tracking-[-.05em]">{value}</div>
          <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>
        </div>)}
      </div>
      {role && <section className="mb-5 rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-6" data-testid="panel-role-requirements">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">Role requirements</p><h2 className="mt-1 text-lg font-bold">{role.name} skills by priority</h2></div><span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold text-muted-foreground">{(role.skills ?? []).length} listed skills</span></div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">{(['core', 'important', 'additional'] as const).map((priority) => {
          const requiredSkills = (role.skills ?? []).filter((skill) => skill.priority === priority);
          return <div key={priority} className="rounded-xl bg-secondary/45 p-3.5">
            <div className="mb-2 flex items-center justify-between"><h3 className="text-[11px] font-bold capitalize">{priority}</h3><span className="text-[10px] text-muted-foreground">{requiredSkills.filter((item) => skills.some((found) => found.name.toLowerCase() === item.name.toLowerCase())).length}/{requiredSkills.length} found</span></div>
            <div className="space-y-1.5">{requiredSkills.map((item) => {
              const found = skills.some((skill) => skill.name.toLowerCase() === item.name.toLowerCase());
              return <div key={item.name} data-testid={`role-skill-${item.name.toLowerCase().replace(/\W+/g, '-')}`} className="flex items-center gap-2 rounded-lg bg-card px-2.5 py-2 text-[11px]">
                <span className={`grid h-4 w-4 place-items-center rounded-full ${found ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'}`}>{found ? <Check size={10} /> : <span className="h-1 w-1 rounded-full bg-current" />}</span>
                <span className="min-w-0 flex-1 font-medium">{item.name}</span>
                <span className="text-[9px] text-muted-foreground">{found ? 'Found' : 'Gap'}</span>
              </div>;
            })}</div>
          </div>;
        })}</div>
      </section>}
      <div className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
        <section className="rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-7" data-testid="card-readiness">
          <div className="flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">Role readiness</p><h2 className="mt-2 text-2xl font-bold">{role?.name || 'Your target role'}</h2></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Target size={19} /></span></div>
          <div className="mt-7 flex items-center gap-6">
            <div className="grid h-[116px] w-[116px] shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(hsl(var(--primary)) ${readiness}%, hsl(var(--secondary)) 0)` }}><div className="grid h-[94px] w-[94px] place-items-center rounded-full bg-card"><div className="text-center"><div className="text-3xl font-extrabold tracking-[-.07em]">{readiness}<span className="text-sm">%</span></div><div className="text-[10px] text-muted-foreground">readiness</div></div></div></div>
            <div><p className="max-w-[340px] text-sm leading-6 text-muted-foreground">This score reflects how much of the role’s requested skill evidence appears in your resume—not your ability or future potential.</p><div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-primary"><CheckCircle2 size={14} /> Based on resume evidence</div></div>
          </div>
        </section>
         <section className="rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-7" data-testid="card-ats-score">
           <div className="flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">ATS-style resume analysis</p><h2 className="mt-2 text-2xl font-bold">Resume signals</h2></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f7f1e5] text-[#a67c35]"><FileCheck2 size={19} /></span></div>
           <p className="mt-2 text-[10px] leading-4 text-muted-foreground">An explainable demo heuristic, not a vendor ATS score. Weighted by keyword coverage 30%, skill match 25%, sections 15%, projects/experience 15%, contact information 10%, and formatting 5%.</p>
          {ats ? <>
            <div className="mt-6 flex items-end gap-2"><span className="text-4xl font-extrabold tracking-[-.07em]" data-testid="value-ats-score">{ats.overallScore}</span><span className="mb-1 text-xs text-muted-foreground">/ 100 · heuristic estimate</span></div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">{Object.entries(ats.breakdown ?? {}).map(([key, value]) => <div key={key} data-testid={`ats-component-${key}`} className="rounded-lg bg-secondary/70 px-2.5 py-2.5">
              <div className="flex items-baseline justify-between gap-1"><span className="text-sm font-bold">{value}</span><span className="text-[8px] text-muted-foreground">/100</span></div>
              <div className="mt-1.5 h-1 rounded-full bg-background"><div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} /></div>
              <div className="mt-1.5 text-[9px] leading-3 text-muted-foreground">{ATS_BREAKDOWN_LABELS[key] ?? key}</div>
            </div>)}</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><p className="mb-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">Keywords found</p><div className="flex flex-wrap gap-1">{(ats.matchedKeywords ?? []).slice(0, 8).map((word) => <span key={word} className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-semibold text-primary">{word}</span>)}</div>{!(ats.matchedKeywords ?? []).length && <p className="text-[10px] text-muted-foreground">No role keywords detected.</p>}</div>
              <div><p className="mb-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">Consider adding</p><div className="flex flex-wrap gap-1">{(ats.missingKeywords ?? []).slice(0, 8).map((word) => <span key={word} className="rounded-full border border-border px-2 py-1 text-[9px] text-muted-foreground">{word}</span>)}</div>{!(ats.missingKeywords ?? []).length && <p className="text-[10px] text-muted-foreground">No listed role keywords are missing.</p>}</div>
            </div>
            {(ats.recommendations ?? []).length > 0 && <div className="mt-4 rounded-lg border border-border bg-background p-3"><p className="text-[10px] font-bold uppercase tracking-[.1em]">Resume improvements to consider</p><ul className="mt-2 space-y-1.5">{(ats.recommendations ?? []).map((recommendation, index) => <li key={recommendation} className="flex gap-2 text-[10px] leading-4 text-muted-foreground"><span className="font-bold text-primary">{index + 1}.</span>{recommendation}</li>)}</ul></div>}
          </> : <EmptySmall text="Add resume analysis to see ATS signals." />}
        </section>
      </div>
      <section className="mt-5 rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">Skill profile</p><h2 className="mt-2 text-xl font-bold">Evidence found in your resume</h2><p className="mt-1 text-xs text-muted-foreground">Confidence indicates how clearly each skill was signaled in the text.</p></div><span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold text-muted-foreground">{skills.length} signals</span></div>
        {skills.length ? <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{skills.map((skill) => <div key={skill.name} data-testid={`skill-${skill.name.toLowerCase().replace(/\W+/g, '-')}`} className="rounded-xl border border-border p-3.5"><div className="flex items-center justify-between"><span className="text-sm font-semibold">{skill.name}</span><span className="text-[10px] font-semibold text-primary">{Math.round(skill.confidence * 100)}% signal</span></div><div className="mt-2 h-1 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${skill.confidence * 100}%` }} /></div><div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>{skill.category}</span><span>{skill.source}</span></div></div>)}</div> : <EmptySmall text="No skills to show yet. Start with a resume analysis." />}
      </section>
      <div className="mt-5 grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
        <section className="rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-6">
          <div><p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">Skill gaps</p><h2 className="mt-2 text-xl font-bold">Focus, not a checklist</h2></div>
          <div className="mt-5 space-y-3">{skillGaps.slice(0, 5).map((skill) => <div key={skill.name} className="flex items-center gap-3 rounded-xl bg-secondary/55 p-3"><span className="h-2 w-2 rounded-full bg-amber-500" /><div className="min-w-0 flex-1"><div className="text-xs font-bold">{skill.name}</div><div className="mt-0.5 text-[10px] text-muted-foreground">Role priority · {skill.priority}</div></div><span className="text-[10px] font-semibold text-muted-foreground">{skill.weight}%</span></div>)}
            {!skillGaps.length && <EmptySmall text="No gaps in the listed skills for this role." />}
          </div>
          {(analysis?.improvementPlan || []).slice(0, 3).length > 0 && <div className="mt-5 border-t border-border pt-4"><p className="mb-3 text-[11px] font-bold uppercase tracking-[.1em] text-muted-foreground">A few next steps</p>{analysis?.improvementPlan.slice(0, 3).map((step, i) => <div key={step} className="mb-2 flex gap-2.5 text-xs leading-5"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</span>{step}</div>)}</div>}
        </section>
         <section className="rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-6">
           <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">Top recommendations</p><h2 className="mt-2 text-xl font-bold">Demo opportunities worth a look</h2><p className="mt-1 text-[10px] text-muted-foreground">Fit blends 70% weighted listed skills and 30% resume-to-description text similarity.</p></div><button type="button" onClick={refreshRecommendations} disabled={!resumeText || recom.isPending} data-testid="button-refresh-recommendations" title={!resumeText ? 'Re-analyze a resume in this session to refresh matches' : 'Refresh matches'} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[11px] font-bold transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50">{recom.isPending ? <LoaderCircle size={13} className="animate-spin" /> : <Sparkles size={13} />}{!resumeText ? 'Refresh after analysis' : 'Refresh matches'}</button></div>
          {recom.isError && <InlineError retry={refreshRecommendations} />}
          <div className="mt-4 space-y-3">{recommendations.slice(0, 3).map((match) => <MatchCard key={match.id} match={match} saved={Boolean(local.interactions[match.id]?.includes('saved'))} applied={Boolean(local.interactions[match.id]?.includes('applied'))} onSave={() => act(match, 'saved')} onApply={() => act(match, 'applied')} onView={() => act(match, 'viewed')} />)}
            {!recommendations.length && <EmptySmall text="Recommendations will appear after your first resume analysis." />}
          </div>
        </section>
      </div>
      <section className="mt-5 rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-6" data-testid="panel-recent-activity">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">Recent activity</p><h2 className="mt-1 text-lg font-bold">Your recent steps</h2></div><Link href="/reports" className="text-[11px] font-bold text-primary" data-testid="link-dashboard-reports">View progress</Link></div>
        {local.activityLog.length ? <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {local.activityLog.slice(-4).reverse().map((event, index) => <Link key={`${event.jobId}-${event.action}-${event.timestamp}`} href={`/jobs/${event.jobId}`} data-testid={`activity-${event.action}-${index}`} className="flex items-center gap-3 rounded-xl border border-border p-3 transition hover:border-primary/35">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Activity size={14} /></span>
            <span className="min-w-0 flex-1"><span className="block text-[10px] font-bold uppercase text-muted-foreground">{event.action === 'viewed' ? 'Viewed' : event.action === 'saved' ? 'Saved' : 'Marked applied'}</span><span className="mt-0.5 block truncate text-xs font-semibold">{recentTitles.get(event.jobId) ?? 'Synthetic demo opportunity'}</span></span>
            <span className="shrink-0 text-[9px] text-muted-foreground">{new Date(event.timestamp).toLocaleDateString()}</span>
          </Link>)}
        </div> : <div className="mt-4"><EmptySmall text="No activity yet. View or save a demo role to start your timeline." /></div>}
        <p className="mt-3 text-[10px] text-muted-foreground">Actions are stored in this browser only. “Marked applied” does not submit an application.</p>
      </section>
    </div>
  );
}

function MatchCard({ match, saved, applied, onSave, onApply, onView }: { match: JobMatch; saved: boolean; applied: boolean; onSave: () => void; onApply: () => void; onView: () => void }) {
  const matchedSkills = match.matchedSkills ?? [];
  const missingSkills = match.missingSkills ?? [];
  return <article className="rounded-xl border border-border p-4 transition hover:border-primary/35 hover:shadow-sm" data-testid={`card-recommendation-${match.id}`}>
    <div className="flex items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-xs font-bold text-primary">{(match.company || 'Role').slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><Link href={`/jobs/${match.id}`} onClick={onView} data-testid={`link-job-${match.id}`} className="line-clamp-1 text-sm font-bold hover:text-primary">{match.title}</Link><p className="mt-0.5 text-[11px] text-muted-foreground">{match.company} · {match.city} · {match.workMode}</p></div><div className="rounded-lg bg-primary/10 px-2 py-1 text-center"><div className="text-sm font-extrabold text-primary">{match.matchScore}%</div><div className="text-[9px] font-semibold uppercase text-primary/80">fit</div></div></div>
    <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">{match.explanation?.[0] || `${matchedSkills.length} skills align with your profile.`}</p>
    <div className="mt-3 flex flex-wrap items-center gap-1.5">{matchedSkills.slice(0, 3).map((skill) => <span key={skill} className="rounded-full bg-primary/[.08] px-2 py-1 text-[9px] font-semibold text-primary">{skill}</span>)}{missingSkills.length > 0 && <span className="text-[9px] text-muted-foreground">+{missingSkills.length} to explore</span>}</div>
    <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
      <button type="button" onClick={onSave} data-testid={`button-save-${match.id}`} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-bold ${saved ? 'bg-primary/10 text-primary' : 'border border-border hover:bg-secondary'}`}><Bookmark size={12} />{saved ? 'Saved' : 'Save'}</button>
      <button type="button" onClick={onApply} disabled={applied} data-testid={`button-mark-applied-${match.id}`} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[10px] font-bold hover:bg-secondary disabled:text-primary"><Check size={12} />{applied ? 'Marked applied' : 'Mark applied'}</button>
      <Link href={`/jobs/${match.id}`} onClick={onView} className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-primary" data-testid={`link-details-${match.id}`}>Details <ArrowRight size={12} /></Link>
    </div>
    {applied && <p className="mt-2 text-[10px] text-muted-foreground">Recorded as your action only. No application was sent.</p>}
  </article>;
}

function JobsPage({ local, addInteraction }: { local: LocalState; addInteraction: (id: string, action: 'viewed' | 'saved' | 'applied') => void }) {
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [jobType, setJobType] = useState('');
  const [minimumMatch, setMinimumMatch] = useState(0);
  const [jobLimit, setJobLimit] = useState(60);
  const [sort, setSort] = useState<'best-match' | 'highest-match' | 'newest'>('best-match');
  const params = useMemo(() => ({ ...(query ? { q: query } : {}), ...(category ? { category } : {}), ...(location ? { location } : {}), ...(workMode ? { workMode } : {}), ...(jobType ? { jobType } : {}), sort, limit: jobLimit }), [query, category, location, workMode, jobType, sort, jobLimit]);
  const jobs = useGetJobs(params);
  const dashboard = useGetDashboard(local.analysis ? { roleId: local.analysis.targetRole.id } : local.targetRoleId ? { roleId: local.targetRoleId } : undefined);
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
        return (matchB?.matchScore ?? -1) - (matchA?.matchScore ?? -1)
          || (matchB?.matchedSkills.length ?? 0) - (matchA?.matchedSkills.length ?? 0)
          || b.createdAt.localeCompare(a.createdAt)
          || a.title.localeCompare(b.title);
      });
    } else if (sort === 'highest-match') {
      result.sort((a, b) => (matchById.get(b.id)?.matchScore ?? -1) - (matchById.get(a.id)?.matchScore ?? -1) || a.title.localeCompare(b.title));
    }
    return result;
  }, [jobs.data, sort, matchById, minimumMatch]);
  const submit = (e: FormEvent) => { e.preventDefault(); setQuery(q); };
  const act = (job: Job, action: 'viewed' | 'saved' | 'applied') => {
    addInteraction(job.id, action);
  };
  const categories = Array.from(new Set((jobs.data || []).map((j) => j.category))).filter(Boolean);
  const locations = Array.from(new Set((jobs.data || []).map((j) => j.city))).filter(Boolean);
  const modes = Array.from(new Set((jobs.data || []).map((j) => j.workMode))).filter(Boolean);
  const types = Array.from(new Set((jobs.data || []).map((j) => j.jobType))).filter(Boolean);
  return <div>
    <PageHeading eyebrow="Curated opportunities" title="Find a place to practice." subtitle="Explore synthetic roles selected to help you build evidence and test a direction. These are not live vacancies." />
    <div className="mb-6 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/[.04] px-4 py-3 text-xs text-muted-foreground"><ShieldCheck size={16} className="shrink-0 text-primary" /><span><strong className="text-foreground">Demo dataset</strong> · Listings are learning examples, not open jobs or application links.</span></div>
    <div className="mb-5 rounded-2xl border border-border bg-card p-4 soft-shadow">
      <form onSubmit={submit} className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="search" data-testid="input-job-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, company, or skill" className="w-full rounded-lg border border-input bg-background py-3 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" /></div>
        <button type="submit" data-testid="button-search-jobs" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-xs font-bold text-primary-foreground hover:opacity-90"><Search size={14} /> Search</button>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-2"><span className="mr-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground"><Filter size={13} /> Filters</span>
        <FilterSelect id="category" label="All categories" value={category} options={categories} onChange={setCategory} />
        <FilterSelect id="location" label="Any location" value={location} options={locations} onChange={setLocation} />
        <FilterSelect id="work-mode" label="Any work mode" value={workMode} options={modes} onChange={setWorkMode} />
        <FilterSelect id="job-type" label="Any job type" value={jobType} options={types} onChange={setJobType} />
         <select data-testid="select-minimum-match" aria-label="Minimum match score" value={minimumMatch} onChange={(e) => setMinimumMatch(Number(e.target.value))} className="rounded-lg border border-input bg-background px-3 py-2 text-[11px] font-semibold outline-none focus:border-primary"><option value={0}>Any match</option><option value={40}>40%+ match</option><option value={60}>60%+ match</option><option value={80}>80%+ match</option></select>
         <select data-testid="select-sort-jobs" aria-label="Sort opportunities" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="ml-auto rounded-lg border border-input bg-background px-3 py-2 text-[11px] font-semibold outline-none focus:border-primary"><option value="best-match">Best match</option><option value="highest-match">Highest match</option><option value="newest">Newest</option></select>
      </div>
    </div>
    {jobs.isLoading ? <div className="grid gap-4 md:grid-cols-2"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div> : jobs.isError ? <ErrorState title="Opportunities aren't available right now" retry={() => jobs.refetch()} /> : !orderedJobs.length ? <EmptyState icon={<Search size={22} />} title="No matches for these filters" body="Try a lower match threshold or clear a filter to see more demo opportunities." action={<button type="button" onClick={() => { setQ(''); setQuery(''); setCategory(''); setLocation(''); setWorkMode(''); setJobType(''); setMinimumMatch(0); setJobLimit(60); }} className="rounded-lg border border-border px-4 py-2.5 text-xs font-bold hover:bg-secondary" data-testid="button-clear-filters">Clear filters</button>} /> : <>
      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground"><span data-testid="text-jobs-count">{orderedJobs.length} opportunities shown</span><span>Showing synthetic listings only</span></div>
      <div className="grid gap-4 md:grid-cols-2">{orderedJobs.map((job) => {
        const isSaved = Boolean(local.interactions[job.id]?.includes('saved'));
        const isApplied = Boolean(local.interactions[job.id]?.includes('applied'));
        const match = matchById.get(job.id);
        const matchScore = match?.matchScore;
        return <article key={job.id} data-testid={`card-job-${job.id}`} className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md sm:p-6">
          <div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-sm font-extrabold text-primary">{job.company.slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><Link href={`/jobs/${job.id}`} onClick={() => act(job, 'viewed')} data-testid={`link-title-${job.id}`} className="line-clamp-1 text-base font-bold tracking-tight group-hover:text-primary">{job.title}</Link><p className="mt-1 text-xs text-muted-foreground">{job.company}</p></div><div className="text-right"><span className="rounded-full bg-secondary px-2 py-1 text-[9px] font-bold text-muted-foreground">{job.source || 'Demo'}</span>{matchScore !== undefined && <div className="mt-2 text-[10px] font-bold text-primary">{matchScore}% fit</div>}</div></div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground"><span className="inline-flex items-center gap-1"><MapPin size={12} />{job.city}</span><span>{job.workMode}</span><span>{job.jobType}</span><span>{job.experienceLevel}</span></div>
          <p className="mt-4 line-clamp-2 text-xs leading-5 text-muted-foreground">{job.description}</p>
           {match ? <div className="mt-4 grid gap-3 sm:grid-cols-2">
             <div><p className="mb-1.5 text-[9px] font-bold uppercase tracking-[.08em] text-primary">Matched skills</p><div className="flex flex-wrap gap-1">{(match.matchedSkills ?? []).slice(0, 4).map((skill) => <span key={skill} className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-semibold text-primary">{skill}</span>)}</div>{!(match.matchedSkills ?? []).length && <span className="text-[10px] text-muted-foreground">No listed skills detected</span>}</div>
             <div><p className="mb-1.5 text-[9px] font-bold uppercase tracking-[.08em] text-muted-foreground">Skills to build</p><div className="flex flex-wrap gap-1">{(match.missingSkills ?? []).slice(0, 4).map((skill) => <span key={skill} className="rounded-full border border-border px-2 py-1 text-[9px] text-muted-foreground">{skill}</span>)}</div>{!(match.missingSkills ?? []).length && <span className="text-[10px] text-muted-foreground">No listed gaps</span>}</div>
           </div> : <div className="mt-4"><p className="mb-1.5 text-[9px] font-bold uppercase tracking-[.08em] text-muted-foreground">Listed role skills</p><div className="flex flex-wrap gap-1.5">{(job.skills ?? []).slice(0, 4).map((skill) => <span key={skill.name} className="rounded-full border border-border px-2.5 py-1 text-[10px] font-medium">{skill.name}</span>)}</div></div>}
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4"><span className="text-xs font-bold">{job.salary?.currency} {formatMoney(job.salary?.min)}–{formatMoney(job.salary?.max)} <span className="font-normal text-muted-foreground">/ year</span></span><div className="flex gap-2">
            <button type="button" onClick={() => act(job, 'saved')} data-testid={`button-save-job-${job.id}`} className={`rounded-lg border px-3 py-2 text-[10px] font-bold ${isSaved ? 'border-primary/20 bg-primary/10 text-primary' : 'border-border hover:bg-secondary'}`}><Bookmark size={13} className="inline" /> {isSaved ? 'Saved' : 'Save'}</button>
            <Link href={`/jobs/${job.id}`} onClick={() => act(job, 'viewed')} data-testid={`link-job-detail-${job.id}`} className="rounded-lg bg-primary px-3 py-2 text-[10px] font-bold text-primary-foreground hover:opacity-90">View role</Link>
          </div></div>
          {isApplied && <p className="mt-2 text-[10px] text-muted-foreground">Marked applied by you · no application was sent</p>}
        </article>;
      })}</div>
      {(jobs.data?.length ?? 0) === jobLimit && jobLimit < 300 && <div className="mt-6 text-center"><button type="button" onClick={() => setJobLimit((current) => Math.min(300, current + 60))} data-testid="button-load-more-jobs" className="rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-bold hover:bg-secondary">Show more demo opportunities</button></div>}
    </>}
  </div>;
}

function FilterSelect({ id, label, value, options, onChange }: { id: string; label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return <select data-testid={`select-filter-${id}`} aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="max-w-[180px] rounded-lg border border-input bg-background px-3 py-2 text-[11px] font-semibold outline-none focus:border-primary"><option value="">{label}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
}

function JobDetailPage({ local, addInteraction }: { local: LocalState; addInteraction: (id: string, action: 'viewed' | 'saved' | 'applied') => void }) {
  const { jobId = '' } = useParams();
  const jobQuery = useGetJob(jobId, { query: { enabled: Boolean(jobId), queryKey: getGetJobQueryKey(jobId) } });
  const dashboard = useGetDashboard(local.analysis ? { roleId: local.analysis.targetRole.id } : local.targetRoleId ? { roleId: local.targetRoleId } : undefined);
  const [showReasoning, setShowReasoning] = useState(true);
  const job = jobQuery.data;
  useEffect(() => {
    if (job) addInteraction(job.id, 'viewed');
  }, [job?.id]);
  const act = (action: 'viewed' | 'saved' | 'applied') => {
    if (!job) return;
    addInteraction(job.id, action);
  };
  if (jobQuery.isLoading) return <div className="space-y-4"><div className="h-8 w-40 animate-pulse rounded bg-secondary" /><SkeletonCard /></div>;
  if (jobQuery.isError || !job) return <ErrorState title="This demo opportunity isn't available" retry={() => jobQuery.refetch()} />;
  const saved = Boolean(local.interactions[job.id]?.includes('saved'));
  const applied = Boolean(local.interactions[job.id]?.includes('applied'));
  const matched = (local.analysis?.recommendations ?? dashboard.data?.recommendations ?? []).find((r) => r.id === job.id);
  return <div className="mx-auto max-w-[1000px]">
    <Link href="/jobs" data-testid="link-back-to-jobs" className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary"><ArrowLeft size={14} /> All opportunities</Link>
    <div className="overflow-hidden rounded-2xl border border-border bg-card soft-shadow">
      <div className="border-b border-border bg-[#f4f7f6] p-6 sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-5"><div className="flex items-start gap-4"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground">{job.company.slice(0, 2).toUpperCase()}</span><div><span className="text-[10px] font-bold uppercase tracking-[.14em] text-primary">Synthetic demo opportunity</span><h1 className="mt-1 text-3xl font-extrabold">{job.title}</h1><p className="mt-2 text-sm text-muted-foreground">{job.company} · {job.city} · {job.workMode}</p></div></div><span className="rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-bold text-muted-foreground">Not a live vacancy</span></div>
        <div className="mt-6 flex flex-wrap gap-2">{[job.category, job.jobType, job.experienceLevel].map((t) => <span key={t} className="rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-semibold">{t}</span>)}</div>
        <div className="mt-6 flex flex-wrap items-center gap-3"><button type="button" onClick={() => act('saved')} data-testid="button-detail-save" className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold ${saved ? 'bg-primary/10 text-primary' : 'border border-border bg-card hover:bg-secondary'}`}><Bookmark size={14} />{saved ? 'Saved' : 'Save opportunity'}</button><button type="button" disabled={applied} onClick={() => act('applied')} data-testid="button-detail-applied" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:bg-primary/10 disabled:text-primary"><Check size={14} />{applied ? 'Marked applied' : 'Mark as applied'}</button><span className="text-[10px] text-muted-foreground">Your action only—no application is sent.</span></div>
      </div>
      <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_300px]">
        <div><h2 className="text-lg font-bold">About this opportunity</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{job.description}</p>
          <h3 className="mt-8 text-base font-bold">Skills this role asks for</h3><p className="mt-1 text-xs text-muted-foreground">Requirements, not claims about your proficiency.</p>
          <div className="mt-4 space-y-2">{(job.skills ?? []).map((skill) => <div key={skill.name} className="flex items-center justify-between rounded-xl border border-border px-4 py-3"><div><span className="text-sm font-semibold">{skill.name}</span><span className="ml-2 text-[10px] text-muted-foreground">{skill.priority} priority</span></div><span className="text-xs text-muted-foreground">{skill.weight}% weight</span></div>)}</div>
        </div>
        <aside className="space-y-4">
          <div className="rounded-xl border border-border p-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">Compensation example</p><p className="mt-2 text-lg font-extrabold">{job.salary?.currency} {formatMoney(job.salary?.min)}–{formatMoney(job.salary?.max)}</p><p className="mt-1 text-[10px] text-muted-foreground">Demo dataset estimate · annual</p></div>
          <div className="rounded-xl border border-primary/20 bg-primary/[.04] p-4">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-primary">Your role fit</p><p className="mt-1 text-2xl font-extrabold">{matched?.matchScore ?? '—'}{matched && <span className="text-sm">%</span>}</p></div><Target size={20} className="text-primary" /></div>
            {matched ? <><button type="button" onClick={() => setShowReasoning(!showReasoning)} data-testid="button-toggle-reasoning" className="mt-3 flex w-full items-center justify-between border-t border-primary/10 pt-3 text-[11px] font-bold text-primary">Why this match <ChevronDown size={14} className={showReasoning ? 'rotate-180' : ''} /></button>{showReasoning && <ul className="mt-2 space-y-2">{(matched.explanation ?? []).map((reason, i) => <li key={i} className="flex gap-2 text-[11px] leading-5 text-muted-foreground"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-primary" />{reason}</li>)}</ul>}<div className="mt-3 flex flex-wrap gap-1">{(matched.matchedSkills ?? []).slice(0, 5).map((s) => <span key={s} className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-semibold text-primary">{s}</span>)}</div></> : <p className="mt-2 text-xs leading-5 text-muted-foreground">Analyze a resume to see an explainable fit for this role.</p>}
          </div>
          <div className="rounded-xl bg-secondary/70 p-4"><div className="flex items-center gap-2 text-xs font-bold"><Clock3 size={14} className="text-primary" /> Added to demo dataset</div><p className="mt-2 text-[10px] text-muted-foreground">{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Date not provided'}</p></div>
        </aside>
      </div>
    </div>
  </div>;
}

function ReportsPage({ local }: { local: LocalState }) {
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
    for (const match of analysisMatches) categories.set(match.category, (categories.get(match.category) ?? 0) + 1);
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
  if (reports.isLoading) return <><PageHeading eyebrow="Progress" title="Small steps, made visible." subtitle="A snapshot of your activity in this demo workspace." /><DashboardSkeleton /></>;
  if (reports.isError) return <ErrorState title="Progress data couldn't be loaded" retry={() => reports.refetch()} />;
  if (!r) return <EmptyState icon={<BarChart3 size={22} />} title="Your progress will appear here" body="Explore a demo opportunity or save a role to create a little activity." action={<Link href="/jobs" className="rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground">Browse demo roles</Link>} />;
  const hasActivity = r.activity.some((day) => day.viewed + day.saved + day.applied > 0);
  return <div>
    <PageHeading eyebrow="Progress" title="Small steps, made visible." subtitle="A snapshot of your activity and readiness in this demo workspace." />
    <div className="mb-6 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/[.04] px-4 py-3 text-xs text-muted-foreground"><Activity size={15} className="text-primary" /> Your activity is a record of actions you chose to take—not applications submitted.</div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['Average match', `${r.averageMatch}%`, 'Across demo role matches', <Target size={17} />], ['ATS clarity', `${r.atsScore}`, 'Resume signal score', <FileCheck2 size={17} />], ['Role readiness', `${r.readiness}%`, 'Against your target role', <Gauge size={17} />], ['Saved roles', r.jobsSaved, 'Kept for your review', <Bookmark size={17} />]].map(([label, value, hint, icon], i) => <div key={String(label)} data-testid={`metric-${String(label).toLowerCase().replace(/\s/g, '-')}`} className="rounded-2xl border border-border bg-card p-5 soft-shadow"><div className="flex items-center justify-between text-muted-foreground"><span className="text-xs font-semibold">{label}</span><span className="text-primary">{icon}</span></div><div className="mt-4 text-3xl font-extrabold tracking-[-.06em]">{value}</div><p className="mt-1 text-[10px] text-muted-foreground">{hint}</p></div>)}</div>
    <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
      <section className="rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-7"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">Activity over time</p><h2 className="mt-2 text-xl font-bold">Show up, a little at a time.</h2></div><span className="text-[10px] text-muted-foreground">Recent days</span></div>
        {!hasActivity ? <div className="mt-5"><EmptySmall text="No recent activity. Viewing a demo opportunity will start your timeline." /></div> : <ChartContainer aria-label="Viewed, saved, and marked-applied actions by day" config={{ viewed: { label: 'Viewed', color: 'hsl(var(--primary))' }, saved: { label: 'Saved', color: '#93b6a7' }, applied: { label: 'Marked applied', color: '#e6bd74' } }} className="mt-4 h-[210px] w-full aspect-auto">
          <BarChart data={r.activity} accessibilityLayer>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={{ fontSize: 9 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="viewed" stackId="actions" fill="var(--color-viewed)" />
            <Bar dataKey="saved" stackId="actions" fill="var(--color-saved)" />
            <Bar dataKey="applied" stackId="actions" fill="var(--color-applied)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>}
        <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-muted-foreground"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-primary" />Viewed {r.jobsViewed}</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#93b6a7]" />Saved {r.jobsSaved}</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#e6bd74]" />Marked applied {r.jobsApplied}</span></div>
      </section>
      <section className="rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-7"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">Where you're exploring</p><h2 className="mt-2 text-xl font-bold">Role categories</h2>
        {r.categories.length ? <ChartContainer aria-label="Number of matched jobs by role category" config={{ count: { label: 'Matched jobs', color: 'hsl(var(--primary))' } }} className="mt-4 h-[220px] w-full aspect-auto">
          <BarChart data={r.categories} layout="vertical" accessibilityLayer margin={{ left: 6, right: 12 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
            <YAxis type="category" dataKey="name" width={120} tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer> : <EmptySmall text="Explore demo roles to see category activity." />}
      </section>
    </div>
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-7"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">Most common gaps</p><h2 className="mt-2 text-xl font-bold">Skills to explore</h2>
        {r.gaps.length ? <ChartContainer aria-label="Frequency of missing skills across matched roles" config={{ count: { label: 'Roles with gap', color: 'hsl(var(--primary))' } }} className="mt-4 h-[240px] w-full aspect-auto">
          <BarChart data={r.gaps.slice(0, 8)} layout="vertical" accessibilityLayer margin={{ left: 6, right: 12 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
            <YAxis type="category" dataKey="name" width={120} tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer> : <EmptySmall text="No recurring gaps yet. Role comparisons will surface patterns here." />}
      </section>
      <section className="rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-7"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">Match distribution</p><h2 className="mt-2 text-xl font-bold">Role fit at a glance</h2>
        {r.distribution.length ? <ChartContainer aria-label="Count of job matches by match-score range" config={{ count: { label: 'Jobs', color: 'hsl(var(--primary))' } }} className="mt-4 h-[220px] w-full aspect-auto">
          <BarChart data={r.distribution} accessibilityLayer>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="range" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 9 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={{ fontSize: 9 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer> : <EmptySmall text="Match distribution appears once roles are compared with your resume." />}
      </section>
    </div>
  </div>;
}

function PageHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return <div className="mb-7"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-primary">{eyebrow}</p><h1 className="mt-2 text-[clamp(2rem,4vw,2.65rem)] font-extrabold leading-tight">{title}</h1><p className="mt-2 max-w-[700px] text-sm leading-6 text-muted-foreground">{subtitle}</p></div>;
}
function EmptySmall({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-xs leading-5 text-muted-foreground">{text}</div>; }
function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">{icon}</span><h2 className="mt-4 text-xl font-bold">{title}</h2><p className="mx-auto mt-2 max-w-[410px] text-sm leading-6 text-muted-foreground">{body}</p>{action && <div className="mt-5">{action}</div>}</div>;
}
function InlineError({ retry }: { retry: () => void }) { return <div className="mt-3 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900"><span>Some demo data couldn't load.</span><button type="button" onClick={retry} className="font-bold underline" data-testid="button-retry-inline">Try again</button></div>; }
function ErrorState({ title, retry }: { title: string; retry: () => void }) {
  return <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-700"><Activity size={21} /></span><h2 className="mt-4 text-xl font-bold">{title}</h2><p className="mt-2 text-sm text-muted-foreground">Please try again. Your local demo activity is still here.</p><button type="button" onClick={retry} data-testid="button-retry" className="mt-5 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground">Retry</button></div>;
}
function SkeletonRows() { return <div className="space-y-4 pt-6"><div className="h-24 animate-pulse rounded-xl bg-secondary" /><div className="h-10 animate-pulse rounded-xl bg-secondary" /></div>; }
function SkeletonCard() { return <div className="h-56 animate-pulse rounded-2xl border border-border bg-card p-5"><div className="h-10 w-2/3 rounded bg-secondary" /><div className="mt-5 h-3 rounded bg-secondary" /><div className="mt-3 h-3 w-4/5 rounded bg-secondary" /><div className="mt-8 h-8 rounded bg-secondary" /></div>; }
function DashboardSkeleton() { return <div className="grid gap-4 lg:grid-cols-2"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>; }
function formatMoney(value?: number) { return typeof value === 'number' ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value) : '—'; }

export default App;