import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Compass,
  Sparkles,
  X,
  Menu,
  CircleHelp,
  Gauge,
  BriefcaseBusiness,
  BarChart3,
} from 'lucide-react';
import { useHealthCheck } from '@ai-career-advisor/api-client';

interface ShellProps {
  children: ReactNode;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
}

export function Shell({ children, menuOpen, setMenuOpen }: ShellProps) {
  const [location] = useLocation();
  const health = useHealthCheck();
  const links = [
    { href: '/dashboard', label: 'Overview', icon: Gauge },
    { href: '/jobs', label: 'Opportunities', icon: BriefcaseBusiness },
    { href: '/reports', label: 'Progress', icon: BarChart3 },
  ];
  const onLanding = location === '/';
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-5 sm:px-8">
          <Link href="/" data-testid="link-brand" className="group flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Compass size={19} strokeWidth={2.4} />
            </span>
            <span className="text-[15px] font-bold tracking-[-.04em]">
              AI Career<span className="font-medium text-muted-foreground"> Advisor</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                data-testid={`link-nav-${label.toLowerCase()}`}
                className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-secondary ${
                  location === href || (href === '/jobs' && location.startsWith('/jobs/'))
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/analyze"
              data-testid="link-nav-analyze"
              className={`ml-2 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-all hover:-translate-y-0.5 ${
                location === '/analyze'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-primary text-primary-foreground hover:opacity-90'
              }`}
            >
              <Sparkles size={15} /> Analyze resume
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-[11px] font-medium text-muted-foreground sm:flex" data-testid="status-api">
              <span className={`h-1.5 w-1.5 rounded-full ${health.isError ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              {health.isLoading ? 'Connecting' : health.isError ? 'Demo mode' : 'Demo dataset'}
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg border border-border p-2 md:hidden"
              data-testid="button-mobile-menu"
              aria-label="Toggle navigation"
            >
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="grid gap-1 border-t border-border px-5 py-3 md:hidden">
            {[...links, { href: '/analyze', label: 'Analyze resume', icon: Sparkles }].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold hover:bg-secondary"
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main className={`${onLanding ? 'max-w-none' : 'mx-auto max-w-[1260px] px-5 pb-16 pt-8 sm:px-8 sm:pt-10'} page-in`}>
        {children}
      </main>
      <footer className="mx-auto flex max-w-[1260px] flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-5 text-[11px] text-muted-foreground sm:px-8">
        <span>AI Career Advisor · Built for clearer next steps.</span>
        <span className="inline-flex items-center gap-1.5">
          <CircleHelp size={13} /> Demo dataset · No live vacancies.
        </span>
      </footer>
    </div>
  );
}
