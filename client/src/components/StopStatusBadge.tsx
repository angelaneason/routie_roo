import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react";

export type StopStatus = "pending" | "in_progress" | "complete" | "missed";

interface StopStatusBadgeProps {
  status: StopStatus;
  className?: string;
}

export function StopStatusBadge({ status, className }: StopStatusBadgeProps) {
  const config = {
    pending: {
      label: "Pending",
      icon: Circle,
      variant: "secondary" as const,
      className: "bg-gray-100 text-gray-700",
    },
    in_progress: {
      label: "In Progress",
      icon: Clock,
      variant: "default" as const,
      className: "bg-blue-100 text-blue-700",
    },
    complete: {
      label: "Complete",
      icon: CheckCircle2,
      variant: "default" as const,
      className: "bg-green-100 text-green-700",
    },
    missed: {
      label: "Missed",
      icon: XCircle,
      variant: "destructive" as const,
      className: "bg-red-100 text-red-700",
    },
  };

  const { label, icon: Icon, className: statusClassName } = config[status];

  return (
    <Badge className={`${statusClassName} ${className || ""}`}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}
