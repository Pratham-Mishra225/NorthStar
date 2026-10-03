import type { Skill } from '@ai-career-advisor/api-client';
import { EmptySmall } from '@/components/common/EmptyState';

interface SkillProfileCardProps {
  skills: Skill[];
}

export function SkillProfileCard({ skills }: SkillProfileCardProps) {
  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">Skill profile</p>
          <h2 className="mt-2 text-xl font-bold">Evidence found in your resume</h2>
          <p className="mt-1 text-xs text-muted-foreground">Confidence indicates how clearly each skill was signaled in the text.</p>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
          {skills.length} signals
        </span>
      </div>
      {skills.length ? (
        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <div
              key={skill.name}
              data-testid={`skill-${skill.name.toLowerCase().replace(/\W+/g, '-')}`}
              className="rounded-xl border border-border p-3.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{skill.name}</span>
                <span className="text-[10px] font-semibold text-primary">{Math.round(skill.confidence * 100)}% signal</span>
              </div>
              <div className="mt-2 h-1 rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary" style={{ width: `${skill.confidence * 100}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                <span>{skill.category}</span>
                <span>{skill.source}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptySmall text="No skills to show yet. Start with a resume analysis." />
      )}
    </section>
  );
}
