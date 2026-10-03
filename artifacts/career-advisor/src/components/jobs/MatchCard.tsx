import { Link } from 'wouter';
import { Bookmark, Check, ArrowRight } from 'lucide-react';
import type { JobMatch } from '@ai-career-advisor/api-client';

interface MatchCardProps {
  match: JobMatch;
  saved: boolean;
  applied: boolean;
  onSave: () => void;
  onApply: () => void;
  onView: () => void;
}

export function MatchCard({ match, saved, applied, onSave, onApply, onView }: MatchCardProps) {
  const matchedSkills = match.matchedSkills ?? [];
  const missingSkills = match.missingSkills ?? [];
  return (
    <article className="rounded-xl border border-border p-4 transition hover:border-primary/35 hover:shadow-sm" data-testid={`card-recommendation-${match.id}`}>
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-xs font-bold text-primary">
          {(match.company || 'Role').slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/jobs/${match.id}`} onClick={onView} data-testid={`link-job-${match.id}`} className="line-clamp-1 text-sm font-bold hover:text-primary">
            {match.title}
          </Link>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{match.company} · {match.city} · {match.workMode}</p>
        </div>
        <div className="rounded-lg bg-primary/10 px-2 py-1 text-center">
          <div className="text-sm font-extrabold text-primary">{match.matchScore}%</div>
          <div className="text-[9px] font-semibold uppercase text-primary/80">fit</div>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">
        {match.explanation?.[0] || `${matchedSkills.length} skills align with your profile.`}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {matchedSkills.slice(0, 3).map((skill) => (
          <span key={skill} className="rounded-full bg-primary/[.08] px-2 py-1 text-[9px] font-semibold text-primary">
            {skill}
          </span>
        ))}
        {missingSkills.length > 0 && <span className="text-[9px] text-muted-foreground">+{missingSkills.length} to explore</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={onSave}
          data-testid={`button-save-${match.id}`}
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-bold ${
            saved ? 'bg-primary/10 text-primary' : 'border border-border hover:bg-secondary'
          }`}
        >
          <Bookmark size={12} />
          {saved ? 'Saved' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onApply}
          disabled={applied}
          data-testid={`button-mark-applied-${match.id}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[10px] font-bold hover:bg-secondary disabled:text-primary"
        >
          <Check size={12} />
          {applied ? 'Marked applied' : 'Mark applied'}
        </button>
        <Link href={`/jobs/${match.id}`} onClick={onView} className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-primary" data-testid={`link-details-${match.id}`}>
          Details <ArrowRight size={12} />
        </Link>
      </div>
      {applied && <p className="mt-2 text-[10px] text-muted-foreground">Recorded as your action only. No application was sent.</p>}
    </article>
  );
}
