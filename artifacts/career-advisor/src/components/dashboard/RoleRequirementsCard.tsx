import { Check } from 'lucide-react';
import type { Role, Skill, WeightedSkill } from '@ai-career-advisor/api-client';

interface RoleRequirementsCardProps {
  role: Role;
  skills: Skill[];
}

export function RoleRequirementsCard({ role, skills }: RoleRequirementsCardProps) {
  const priorities = ['core', 'important', 'additional'] as const;

  return (
    <section className="mb-5 rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-6" data-testid="panel-role-requirements">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">Role requirements</p>
          <h2 className="mt-1 text-lg font-bold">{role.name} skills by priority</h2>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
          {(role.skills ?? []).length} listed skills
        </span>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {priorities.map((priority) => {
          const requiredSkills = (role.skills ?? []).filter((skill: WeightedSkill) => skill.priority === priority);
          return (
            <div key={priority} className="rounded-xl bg-secondary/45 p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[11px] font-bold capitalize">{priority}</h3>
                <span className="text-[10px] text-muted-foreground">
                  {requiredSkills.filter((item: WeightedSkill) => skills.some((found: Skill) => found.name.toLowerCase() === item.name.toLowerCase())).length}/{requiredSkills.length} found
                </span>
              </div>
              <div className="space-y-1.5">
                {requiredSkills.map((item: WeightedSkill) => {
                  const found = skills.some((skill: Skill) => skill.name.toLowerCase() === item.name.toLowerCase());
                  return (
                    <div
                      key={item.name}
                      data-testid={`role-skill-${item.name.toLowerCase().replace(/\W+/g, '-')}`}
                      className="flex items-center gap-2 rounded-lg bg-card px-2.5 py-2 text-[11px]"
                    >
                      <span className={`grid h-4 w-4 place-items-center rounded-full ${found ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'}`}>
                        {found ? <Check size={10} /> : <span className="h-1 w-1 rounded-full bg-current" />}
                      </span>
                      <span className="min-w-0 flex-1 font-medium">{item.name}</span>
                      <span className="text-[9px] text-muted-foreground">{found ? 'Found' : 'Gap'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
