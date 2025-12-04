import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface WidgetVisibility {
  metrics: boolean;
  charts: boolean;
  upcomingRoutes: boolean;
  quickActions: boolean;
}

interface DashboardCustomizationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

const widgetLabels: Record<string, string> = {
  metrics: "Metrics Cards",
  charts: "Charts",
  upcomingRoutes: "Upcoming Routes",
  quickActions: "Quick Actions",
};

interface SortableWidgetItemProps {
  id: string;
  label: string;
  visible: boolean;
  onToggle: (id: string, visible: boolean) => void;
}

function SortableWidgetItem({ id, label, visible, onToggle }: SortableWidgetItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 border rounded-lg bg-white"
    >
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <Label htmlFor={`widget-${id}`} className="cursor-pointer">
          {label}
        </Label>
      </div>
      <Switch
        id={`widget-${id}`}
        checked={visible}
        onCheckedChange={(checked) => onToggle(id, checked)}
      />
    </div>
  );
}

export function DashboardCustomization({ open, onOpenChange, onSave }: DashboardCustomizationProps) {
  const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibility>({
    metrics: true,
    charts: true,
    upcomingRoutes: true,
    quickActions: true,
  });
  const [widgetOrder, setWidgetOrder] = useState<string[]>([
    "metrics",
    "charts",
    "upcomingRoutes",
    "quickActions",
  ]);

  const preferencesQuery = trpc.dashboardPreferences.get.useQuery(undefined, {
    enabled: open,
  });

  const updatePreferencesMutation = trpc.dashboardPreferences.update.useMutation({
    onSuccess: () => {
      toast.success("Dashboard preferences saved! 🦘");
      onSave();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to save preferences: ${error.message}`);
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (preferencesQuery.data) {
      setWidgetVisibility(preferencesQuery.data.widgetVisibility);
      setWidgetOrder(preferencesQuery.data.widgetOrder);
    }
  }, [preferencesQuery.data]);

  const handleToggle = (id: string, visible: boolean) => {
    setWidgetVisibility((prev) => ({
      ...prev,
      [id]: visible,
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = () => {
    updatePreferencesMutation.mutate({
      widgetVisibility,
      widgetOrder,
    });
  };

  const handleReset = () => {
    setWidgetVisibility({
      metrics: true,
      charts: true,
      upcomingRoutes: true,
      quickActions: true,
    });
    setWidgetOrder(["metrics", "charts", "upcomingRoutes", "quickActions"]);
    toast.success("Reset to default layout");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Customize Dashboard</DialogTitle>
          <DialogDescription>
            Show/hide widgets and drag to reorder them on your dashboard.
          </DialogDescription>
        </DialogHeader>

        {preferencesQuery.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={widgetOrder} strategy={verticalListSortingStrategy}>
                {widgetOrder.map((widgetId) => (
                  <SortableWidgetItem
                    key={widgetId}
                    id={widgetId}
                    label={widgetLabels[widgetId]}
                    visible={widgetVisibility[widgetId as keyof WidgetVisibility]}
                    onToggle={handleToggle}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={updatePreferencesMutation.isPending}
          >
            Reset to Default
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updatePreferencesMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updatePreferencesMutation.isPending}
            >
              {updatePreferencesMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
