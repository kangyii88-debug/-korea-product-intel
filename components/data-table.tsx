export function DataTable({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white">{children}</div>;
}
