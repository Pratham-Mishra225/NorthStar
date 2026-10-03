import type { WeightedSkill } from '@ai-career-advisor/api-client';
import { EmptySmall } from '@/components/common/EmptyState';

interface SkillGapsCardProps {
  skillGaps: WeightedSkill[];
  improvementPlan?: string[];
}

export function SkillGapsCard({ skillGaps, improvementPlan }: SkillGapsCardProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">Skill gaps</p>
        <h2 className="mt-2 text-xl font-bold">Focus, not a checklist</h2>
      </div>
      <div className="mt-5 space-y-3">
        {skillGaps.slice(0, 5).map((skill) => (
          <div key={skill.name} className="flex items-center gap-3 rounded-xl bg-secondary/55 p-3">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold">{skill.name}</div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">Role priority · {skill.priority}</div>
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground">{skill.weight}%</span>
          </div>
        ))}
        {!skillGaps.length && <EmptySmall text="No gaps in the listed skills for this role." />}
      </div>
      {(improvementPlan || []).slice(0, 3).length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[.1em] text-muted-foreground">A few next steps</p>
          {(improvementPlan ?? []).slice(0, 3).map((step, i) => (
            <div key={step} className="mb-2 flex gap-2.5 text-xs leading-5">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                {i + 1}
              </span>
              {step}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
