type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-1.5">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle ? (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}
