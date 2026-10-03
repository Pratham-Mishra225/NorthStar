import { FileCheck2 } from 'lucide-react';
import type { AtsAnalysis } from '@ai-career-advisor/api-client';
import { ATS_BREAKDOWN_LABELS } from '@/utils/constants';
import { EmptySmall } from '@/components/common/EmptyState';

interface AtsScoreCardProps {
  ats?: AtsAnalysis;
}

export function AtsScoreCard({ ats }: AtsScoreCardProps) {
  const breakdownEntries = ats?.breakdown
    ? (Object.entries(ats.breakdown) as Array<[keyof typeof ats.breakdown, number]>)
    : [];

  return (
    <section className="rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-7" data-testid="card-ats-score">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">ATS-style resume analysis</p>
          <h2 className="mt-2 text-2xl font-bold">Resume signals</h2>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f7f1e5] text-[#a67c35]">
          <FileCheck2 size={19} />
        </span>
      </div>
      <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
        An explainable demo heuristic, not a vendor ATS score. Weighted by keyword coverage 30%, skill match 25%, sections 15%, projects/experience 15%, contact information 10%, and formatting 5%.
      </p>
      {ats ? (
        <>
          <div className="mt-6 flex items-end gap-2">
            <span className="text-4xl font-extrabold tracking-[-.07em]" data-testid="value-ats-score">
              {ats.overallScore}
            </span>
            <span className="mb-1 text-xs text-muted-foreground">/ 100 · heuristic estimate</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {breakdownEntries.map(([key, value]) => (
              <div key={key} data-testid={`ats-component-${key}`} className="rounded-lg bg-secondary/70 px-2.5 py-2.5">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-sm font-bold">{value}</span>
                  <span className="text-[8px] text-muted-foreground">/100</span>
                </div>
                <div className="mt-1.5 h-1 rounded-full bg-background">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
                </div>
                <div className="mt-1.5 text-[9px] leading-3 text-muted-foreground">
                  {ATS_BREAKDOWN_LABELS[key] ?? key}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">Keywords found</p>
              <div className="flex flex-wrap gap-1">
                {(ats.matchedKeywords ?? []).slice(0, 8).map((word: string) => (
                  <span key={word} className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-semibold text-primary">
                    {word}
                  </span>
                ))}
              </div>
              {!(ats.matchedKeywords ?? []).length && <p className="text-[10px] text-muted-foreground">No role keywords detected.</p>}
            </div>
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">Consider adding</p>
              <div className="flex flex-wrap gap-1">
                {(ats.missingKeywords ?? []).slice(0, 8).map((word: string) => (
                  <span key={word} className="rounded-full border border-border px-2 py-1 text-[9px] text-muted-foreground">
                    {word}
                  </span>
                ))}
              </div>
              {!(ats.missingKeywords ?? []).length && <p className="text-[10px] text-muted-foreground">No listed role keywords are missing.</p>}
            </div>
          </div>
          {(ats.recommendations ?? []).length > 0 && (
            <div className="mt-4 rounded-lg border border-border bg-background p-3">
              <p className="text-[10px] font-bold uppercase tracking-[.1em]">Resume improvements to consider</p>
              <ul className="mt-2 space-y-1.5">
                {(ats.recommendations ?? []).map((recommendation: string, index: number) => (
                  <li key={recommendation} className="flex gap-2 text-[10px] leading-4 text-muted-foreground">
                    <span className="font-bold text-primary">{index + 1}.</span>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <EmptySmall text="Add resume analysis to see ATS signals." />
      )}
    </section>
  );
}
