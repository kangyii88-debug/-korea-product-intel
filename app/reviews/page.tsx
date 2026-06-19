import { AppShell } from "@/components/app-shell";
import { BusinessAIModule } from "@/components/business-ai-module";

export default function ReviewsPage() {
  return (
    <AppShell>
      <BusinessAIModule kind="reviews" taskType="review_analysis" />
    </AppShell>
  );
}
