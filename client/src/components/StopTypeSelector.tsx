import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Circle, Package, Truck, Users, MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc";

export type StopType = "pickup" | "delivery" | "meeting" | "visit" | "other";

export interface StopTypeConfig {
  type: StopType;
  label: string;
  color: string;
  icon: React.ReactNode;
}

export const stopTypeConfigs: StopTypeConfig[] = [
  {
    type: "pickup",
    label: "Pickup",
    color: "#10b981", // green
    icon: <Package className="h-4 w-4" />,
  },
  {
    type: "delivery",
    label: "Delivery",
    color: "#f59e0b", // amber
    icon: <Truck className="h-4 w-4" />,
  },
  {
    type: "meeting",
    label: "Meeting",
    color: "#8b5cf6", // purple
    icon: <Users className="h-4 w-4" />,
  },
  {
    type: "visit",
    label: "Visit",
    color: "#3b82f6", // blue
    icon: <MapPin className="h-4 w-4" />,
  },
  {
    type: "other",
    label: "Other",
    color: "#6b7280", // gray
    icon: <Circle className="h-4 w-4" />,
  },
];

export function getStopTypeConfig(type: StopType): StopTypeConfig {
  return stopTypeConfigs.find(c => c.type === type) || stopTypeConfigs[4];
}

interface StopTypeSelectorProps {
  value: StopType;
  onChange: (value: StopType) => void;
  size?: "sm" | "default";
}

export function StopTypeSelector({ value, onChange, size = "default" }: StopTypeSelectorProps) {
  const { data: customStopTypes } = trpc.stopTypes.list.useQuery();
  
  // Use custom stop types if available, otherwise fall back to default configs
  const stopTypes = customStopTypes && customStopTypes.length > 0
    ? customStopTypes.map(st => ({
        type: st.name.toLowerCase().replace(/\s+/g, '-') as StopType,
        label: st.name,
        color: st.color,
        icon: <Circle className="h-4 w-4" />,
      }))
    : stopTypeConfigs;

  const currentType = stopTypes.find(st => st.type === value || st.label === value);
  const displayValue = currentType?.label || value;
  const displayColor = currentType?.color || "#3b82f6";

  return (
    <Select value={value} onValueChange={(v) => onChange(v as StopType)}>
      <SelectTrigger className={size === "sm" ? "h-8 text-xs" : ""}>
        <SelectValue>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: displayColor }}
            />
            <span>{displayValue}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {stopTypes.map((config) => (
          <SelectItem key={config.type} value={config.type}>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: config.color }}
              />
              <span>{config.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
