import { Badge } from "@/components/ui/badge";

type Status = "pending" | "verified" | "suspended";

const statusConfig: Record<Status, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-amber-100 text-amber-800" },
  verified: { label: "Vérifié", className: "bg-green-100 text-green-800" },
  suspended: { label: "Suspendu", className: "bg-red-100 text-red-800" },
};

export function StatusBadge({ isVerified, isSuspended }: { isVerified: boolean; isSuspended: boolean }) {
  const status: Status = isSuspended ? "suspended" : isVerified ? "verified" : "pending";
  const config = statusConfig[status];
  return <Badge className={config.className}>{config.label}</Badge>;
}
