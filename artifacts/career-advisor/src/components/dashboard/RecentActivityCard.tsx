import { Link } from 'wouter';
import { Activity } from 'lucide-react';
import type { ActivityEvent } from '@/types/career';
import { EmptySmall } from '@/components/common/EmptyState';

interface RecentActivityCardProps {
  activityLog: ActivityEvent[];
  recentTitles: Map<string, string>;
}

export function RecentActivityCard({ activityLog, recentTitles }: RecentActivityCardProps) {
  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-6" data-testid="panel-recent-activity">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">Recent activity</p>
          <h2 className="mt-1 text-lg font-bold">Your recent steps</h2>
        </div>
        <Link href="/reports" className="text-[11px] font-bold text-primary" data-testid="link-dashboard-reports">
          View progress
        </Link>
      </div>
      {activityLog.length ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {activityLog.slice(-4).reverse().map((event, index) => (
            <Link
              key={`${event.jobId}-${event.action}-${event.timestamp}`}
              href={`/jobs/${event.jobId}`}
              data-testid={`activity-${event.action}-${index}`}
              className="flex items-center gap-3 rounded-xl border border-border p-3 transition hover:border-primary/35"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Activity size={14} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                  {event.action === 'viewed' ? 'Viewed' : event.action === 'saved' ? 'Saved' : 'Marked applied'}
                </span>
                <span className="mt-0.5 block truncate text-xs font-semibold">
                  {recentTitles.get(event.jobId) ?? 'Synthetic demo opportunity'}
                </span>
              </span>
              <span className="shrink-0 text-[9px] text-muted-foreground">
                {new Date(event.timestamp).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <EmptySmall text="No activity yet. View or save a demo role to start your timeline." />
        </div>
      )}
      <p className="mt-3 text-[10px] text-muted-foreground">
        Actions are stored in this browser only. “Marked applied” does not submit an application.
      </p>
    </section>
  );
}
