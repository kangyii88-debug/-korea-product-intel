import { StatusBadge } from "@/components/status-badge";

export function RiskBadge({
  level,
  detail,
}: {
  level: "低" | "中" | "高";
  detail?: string;
}) {
  const tone = level === "高" ? "danger" : level === "中" ? "warning" : "success";
  return <StatusBadge tone={tone}>{detail ? `${level} · ${detail}` : level}</StatusBadge>;
}
