import { Target, CheckCircle2 } from 'lucide-react';
import type { Role } from '@ai-career-advisor/api-client';

interface ReadinessCardProps {
  role?: Role;
  readiness: number;
}

export function ReadinessCard({ role, readiness }: ReadinessCardProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-7" data-testid="card-readiness">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">Role readiness</p>
          <h2 className="mt-2 text-2xl font-bold">{role?.name || 'Your target role'}</h2>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Target size={19} />
        </span>
      </div>
      <div className="mt-7 flex items-center gap-6">
        <div
          className="grid h-[116px] w-[116px] shrink-0 place-items-center rounded-full"
          style={{ background: `conic-gradient(hsl(var(--primary)) ${readiness}%, hsl(var(--secondary)) 0)` }}
        >
          <div className="grid h-[94px] w-[94px] place-items-center rounded-full bg-card">
            <div className="text-center">
              <div className="text-3xl font-extrabold tracking-[-.07em]">
                {readiness}
                <span className="text-sm">%</span>
              </div>
              <div className="text-[10px] text-muted-foreground">readiness</div>
            </div>
          </div>
        </div>
        <div>
          <p className="max-w-[340px] text-sm leading-6 text-muted-foreground">
            This score reflects how much of the role’s requested skill evidence appears in your resume—not your ability or future potential.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-primary">
            <CheckCircle2 size={14} /> Based on resume evidence
          </div>
        </div>
      </div>
    </section>
  );
}
