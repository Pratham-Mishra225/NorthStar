import { Link } from 'wouter';
import type { ResumeAnalysis } from '@ai-career-advisor/api-client';

interface AnalysisResultProps {
  result: ResumeAnalysis;
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/[.04] p-5 sm:p-7" data-testid="panel-analysis-results">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[.14em] text-primary">Analysis ready</span>
          <h2 className="mt-1 text-xl font-bold">{result.readiness}% readiness for {result.targetRole.name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">Signals found in {result.filename}; not a measure of your potential.</p>
        </div>
        <Link href="/dashboard" data-testid="link-analysis-dashboard" className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
          Open workspace
        </Link>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-bold">Matched role skills</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {result.matchedRoleSkills.map((skill) => (
              <span key={skill} className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                {skill}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold">Skills to build or demonstrate</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {result.missingRoleSkills.map((skill) => (
              <span key={skill.name} className="rounded-full border border-border bg-card px-2.5 py-1 text-[10px] text-muted-foreground">
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
