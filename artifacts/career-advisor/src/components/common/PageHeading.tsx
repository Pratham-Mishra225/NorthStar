interface PageHeadingProps {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export function PageHeading({ eyebrow, title, subtitle }: PageHeadingProps) {
  return (
    <div className="mb-7">
      <p className="text-[10px] font-bold uppercase tracking-[.15em] text-primary">{eyebrow}</p>
      <h1 className="mt-2 text-[clamp(2rem,4vw,2.65rem)] font-extrabold leading-tight">{title}</h1>
      <p className="mt-2 max-w-[700px] text-sm leading-6 text-muted-foreground">{subtitle}</p>
    </div>
  );
}
