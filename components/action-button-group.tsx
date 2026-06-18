import { Button } from "@/components/ui/button";

export function ActionButtonGroup({
  actions,
}: {
  actions: Array<{ label: string; icon?: React.ReactNode }>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button key={action.label} variant="outline" size="sm">
          {action.icon}
          {action.label}
        </Button>
      ))}
    </div>
  );
}
