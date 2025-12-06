import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ScheduleDaysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactName: string;
  currentScheduledDays: string[];
  onSave: (scheduledDays: string[]) => void;
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

export function ScheduleDaysDialog({
  open,
  onOpenChange,
  contactName,
  currentScheduledDays,
  onSave,
}: ScheduleDaysDialogProps) {
  const [selectedDays, setSelectedDays] = React.useState<string[]>(currentScheduledDays);

  // Update selectedDays when dialog opens with new contact
  React.useEffect(() => {
    if (open) {
      setSelectedDays(currentScheduledDays);
    }
  }, [open, currentScheduledDays]);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = () => {
    onSave(selectedDays);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Visit Days</DialogTitle>
          <DialogDescription>
            Select which days of the week to visit <strong>{contactName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="flex items-center space-x-3">
              <Checkbox
                id={`day-${day}`}
                checked={selectedDays.includes(day)}
                onCheckedChange={() => toggleDay(day)}
              />
              <Label
                htmlFor={`day-${day}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {day}
              </Label>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
