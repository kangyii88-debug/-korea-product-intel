export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="border-b border-slate-200/90 bg-[#f7f8fa]">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-5 px-5 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:py-10">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{eyebrow}</p>
          <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.03em] text-slate-950 sm:text-[36px]">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-[15px]">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
