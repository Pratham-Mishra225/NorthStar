import { Activity } from 'lucide-react';

interface ErrorStateProps {
  title: string;
  retry: () => void;
}

export function ErrorState({ title, retry }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-700">
        <Activity size={21} />
      </span>
      <h2 className="mt-4 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">Please try again. Your local demo activity is still here.</p>
      <button
        type="button"
        onClick={retry}
        data-testid="button-retry"
        className="mt-5 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground"
      >
        Retry
      </button>
    </div>
  );
}

export function InlineError({ retry }: { retry: () => void }) {
  return (
    <div className="mt-3 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <span>Some demo data couldn't load.</span>
      <button type="button" onClick={retry} className="font-bold underline" data-testid="button-retry-inline">
        Try again
      </button>
    </div>
  );
}
