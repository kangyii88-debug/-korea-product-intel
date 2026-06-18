import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ModulePlaceholderPage({
  eyebrow,
  title,
  description,
  bullets,
}: {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <AppShell>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">模块说明</h2>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            {bullets.map((item) => (
              <p key={item}>- {item}</p>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
