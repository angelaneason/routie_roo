import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface DaySchedulerProps {
  contactId: number;
  contactName: string;
  initialScheduledDays?: string[];
  onUpdate?: () => void;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function DayScheduler({
  contactId,
  contactName,
  initialScheduledDays = [],
  onUpdate,
}: DaySchedulerProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>(
    initialScheduledDays
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const updateScheduledDaysMutation =
    trpc.contacts.updateScheduledDays.useMutation({
      onSuccess: () => {
        toast.success(`Updated schedule for ${contactName}`);
        onUpdate?.();
      },
      onError: (error) => {
        toast.error(`Failed to update schedule: ${error.message}`);
      },
      onSettled: () => {
        setIsUpdating(false);
      },
    });

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    setIsUpdating(true);
    updateScheduledDaysMutation.mutate({
      contactId,
      scheduledDays: selectedDays,
    });
  };

  const hasChanges =
    JSON.stringify(selectedDays.sort()) !==
    JSON.stringify(initialScheduledDays.sort());

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Schedule for:</Label>
        <div className="grid grid-cols-2 gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="flex items-center space-x-2">
              <Checkbox
                id={`day-${day}-${contactId}`}
                checked={selectedDays.includes(day)}
                onCheckedChange={() => handleDayToggle(day)}
              />
              <Label
                htmlFor={`day-${day}-${contactId}`}
                className="text-sm font-normal cursor-pointer"
              >
                {day}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {hasChanges && (
        <Button
          onClick={handleSave}
          disabled={isUpdating}
          className="w-full"
          size="sm"
        >
          {isUpdating ? "Saving..." : "Save Schedule"}
        </Button>
      )}

      {selectedDays.length > 0 && !hasChanges && (
        <p className="text-sm text-muted-foreground">
          Scheduled for: {selectedDays.join(", ")}
        </p>
      )}
    </div>
  );
}
