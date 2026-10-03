import { useState } from 'react';
import type { FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth/mammoth.browser';
import {
  Upload,
  ShieldCheck,
  ChevronDown,
  FileText,
  LoaderCircle,
  ArrowRight,
} from 'lucide-react';
import {
  getGetDashboardQueryKey,
  getGetReportsQueryKey,
  getGetRoleQueryKey,
  useAnalyzeResume,
  useGetRole,
  useGetRoles,
} from '@ai-career-advisor/api-client';
import type { LocalState } from '@/types/career';
import { DEMO_RESUME } from '@/utils/constants';
import { PageHeading } from '@/components/common/PageHeading';
import { InlineError } from '@/components/common/ErrorState';
import { AnalysisResult } from '@/components/resume/AnalysisResult';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface AnalyzeProps {
  local: LocalState;
  persist: (s: LocalState) => void;
  setResumeText: (s: string) => void;
}

export function Analyze({ local, persist, setResumeText }: AnalyzeProps) {
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
    if (!['pdf', 'docx', 'txt'].includes(extension || '')) {
      setFileError('Choose a PDF, DOCX, or TXT file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError('Choose a file smaller than 10 MB.');
      return;
    }
    setFileError('');
    try {
      let extracted = '';
      if (extension === 'txt') {
        extracted = await file.text();
      } else if (extension === 'pdf') {
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
      setText(extracted);
      setFilename(file.name);
    } catch {
      setFileError(`We couldn't extract readable text from ${file.name}. Try another file or paste your resume text below.`);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (text.trim().length < 20 || text.trim().length > 100000 || !roleId) return;
    analyze.mutate(
      { data: { filename, text: text.trim(), targetRoleId: roleId } },
      {
        onSuccess: (result) => {
          setResumeText(text.trim());
          persist({ ...local, targetRoleId: roleId, analysis: result });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetReportsQueryKey() });
        },
      }
    );
  };

  return (
    <div className="mx-auto max-w-[890px]">
      <PageHeading
        eyebrow="Resume analysis"
        title="Start with what's already there."
        subtitle="Choose a target role and share resume text. We’ll map the evidence, not make assumptions."
      />
      <div className="mb-6 flex gap-3 rounded-xl border border-primary/20 bg-primary/[.045] p-4 text-[13px] leading-5 text-muted-foreground">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary" />
        <span>
          <strong className="text-foreground">Private by design.</strong> Resume text stays in this browser session and is sent only when you request analysis or refreshed matches. The demo API does not persist it, and browser storage keeps analysis results—not the resume text.
        </span>
      </div>
      <form onSubmit={submit} className="space-y-5">
        <section className="rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-7">
          <div className="flex items-start gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-primary">
              <span className="text-sm font-bold">1</span>
            </span>
            <div>
              <h2 className="text-lg font-bold">Pick a role to explore</h2>
              <p className="mt-1 text-xs text-muted-foreground">Compare against the role’s listed skills and priorities.</p>
            </div>
          </div>
          <label className="mt-5 block text-xs font-bold text-foreground" htmlFor="role-select">
            Target role
          </label>
          <div className="relative mt-2">
            <select
              id="role-select"
              data-testid="select-target-role"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              required
            >
              <option value="">Select a role</option>
              {roles.data?.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} · {role.category}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
          {roles.isLoading && <p className="mt-2 text-xs text-muted-foreground">Loading role options…</p>}
          {roles.isError && <InlineError retry={() => roles.refetch()} />}
          {currentRole && (
            <div className="mt-4 rounded-xl bg-secondary/70 p-4">
              <p className="text-xs leading-5 text-muted-foreground">{currentRole.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {currentRole.skills.slice(0, 5).map((skill) => (
                  <span key={skill.name} className="rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-semibold">
                    {skill.name}
                    <span className="ml-1.5 text-muted-foreground">{skill.priority}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
        <section className="rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-7">
          <div className="flex items-start gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-primary">
              <span className="text-sm font-bold">2</span>
            </span>
            <div>
              <h2 className="text-lg font-bold">Add resume evidence</h2>
              <p className="mt-1 text-xs text-muted-foreground">PDF and DOCX work when readable text can be extracted. You can always paste text.</p>
            </div>
          </div>
          <label
            htmlFor="resume-file"
            className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-primary/30 bg-[#f7faf9] px-5 py-7 text-center transition hover:border-primary hover:bg-primary/[.035]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <Upload size={19} />
            </span>
            <span className="mt-3 text-sm font-bold">Choose a file</span>
            <span className="mt-1 text-xs text-muted-foreground">PDF, DOCX, or TXT · text extraction is checked before analysis</span>
          </label>
          <input
            id="resume-file"
            data-testid="input-resume-file"
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={(e) => void onFile(e.target.files?.[0])}
            className="sr-only"
          />
          {fileError && (
            <div data-testid="status-file-error" className="mt-3 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-700">
              {fileError}
            </div>
          )}
          <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
            or paste text
          </div>
          <textarea
            data-testid="input-resume-text"
            aria-label="Resume text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setFilename('pasted-resume.txt');
            }}
            rows={9}
            placeholder="Paste resume text here. Include projects, experience, education, and skills you want us to consider."
            className="w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm leading-6 outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            <span>20–100,000 characters</span>
            <span data-testid="text-resume-length">{text.length.toLocaleString()} characters</span>
          </div>
          <button
            type="button"
            data-testid="button-use-demo-resume"
            onClick={() => {
              setText(DEMO_RESUME);
              setFilename('maya-chen-demo-resume.txt');
              setFileError('');
            }}
            className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
          >
            <FileText size={14} /> Use a sample resume
          </button>
        </section>
        {analyze.isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" data-testid="status-analysis-error">
            Analysis couldn't be completed. Check the text and try again.
          </div>
        )}
        {analyze.data && <AnalysisResult result={analyze.data} />}
        <button
          type="submit"
          disabled={analyze.isPending || text.trim().length < 20 || text.trim().length > 100000 || !roleId}
          data-testid="button-analyze-resume"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {analyze.isPending ? (
            <>
              <LoaderCircle size={17} className="animate-spin" /> Reviewing resume evidence…
            </>
          ) : (
            <>
              Analyze my role fit <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
