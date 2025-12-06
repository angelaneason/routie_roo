import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecurringScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactName: string;
  initialSchedule?: {
    repeatInterval: number;
    repeatDays: string[];
    scheduleEndType: "never" | "date" | "occurrences";
    scheduleEndDate?: string;
    scheduleEndOccurrences?: number;
  };
  onSave: (schedule: {
    repeatInterval: number;
    repeatDays: string[];
    scheduleEndType: "never" | "date" | "occurrences";
    scheduleEndDate?: string;
    scheduleEndOccurrences?: number;
  }) => void;
}

const DAYS = [
  { short: "S", full: "Sunday" },
  { short: "M", full: "Monday" },
  { short: "T", full: "Tuesday" },
  { short: "W", full: "Wednesday" },
  { short: "T", full: "Thursday" },
  { short: "F", full: "Friday" },
  { short: "S", full: "Saturday" },
];

export default function RecurringScheduleDialog({
  open,
  onOpenChange,
  contactName,
  initialSchedule,
  onSave,
}: RecurringScheduleDialogProps) {
  const [repeatInterval, setRepeatInterval] = useState(initialSchedule?.repeatInterval || 1);
  const [selectedDays, setSelectedDays] = useState<string[]>(initialSchedule?.repeatDays || []);
  const [endType, setEndType] = useState<"never" | "date" | "occurrences">(
    initialSchedule?.scheduleEndType || "never"
  );
  const [endDate, setEndDate] = useState(initialSchedule?.scheduleEndDate || "");
  const [endOccurrences, setEndOccurrences] = useState(initialSchedule?.scheduleEndOccurrences || 13);

  const handleDayToggle = (dayFull: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayFull) ? prev.filter((d) => d !== dayFull) : [...prev, dayFull]
    );
  };

  const handleSave = () => {
    if (selectedDays.length === 0) {
      alert("Please select at least one day");
      return;
    }

    onSave({
      repeatInterval,
      repeatDays: selectedDays,
      scheduleEndType: endType,
      scheduleEndDate: endType === "date" ? endDate : undefined,
      scheduleEndOccurrences: endType === "occurrences" ? endOccurrences : undefined,
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset to initial values
    setRepeatInterval(initialSchedule?.repeatInterval || 1);
    setSelectedDays(initialSchedule?.repeatDays || []);
    setEndType(initialSchedule?.scheduleEndType || "never");
    setEndDate(initialSchedule?.scheduleEndDate || "");
    setEndOccurrences(initialSchedule?.scheduleEndOccurrences || 13);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule {contactName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Repeat Every */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Repeat every</Label>
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <Input
                  type="number"
                  min="1"
                  max="52"
                  value={repeatInterval}
                  onChange={(e) => setRepeatInterval(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 pr-8 text-center"
                />
                <div className="absolute right-1 flex flex-col">
                  <button
                    type="button"
                    onClick={() => setRepeatInterval((prev) => Math.min(52, prev + 1))}
                    className="h-4 w-6 flex items-center justify-center hover:bg-accent rounded-sm"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepeatInterval((prev) => Math.max(1, prev - 1))}
                    className="h-4 w-6 flex items-center justify-center hover:bg-accent rounded-sm"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <span className="text-sm">{repeatInterval === 1 ? "week" : "weeks"}</span>
            </div>
          </div>

          {/* Repeat On */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Repeat on</Label>
            <div className="flex gap-2 justify-between">
              {DAYS.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDayToggle(day.full)}
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    selectedDays.includes(day.full)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                  title={day.full}
                >
                  {day.short}
                </button>
              ))}
            </div>
          </div>

          {/* Ends */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Ends</Label>
            <RadioGroup value={endType} onValueChange={(value) => setEndType(value as typeof endType)}>
              {/* Never */}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="never" id="never" />
                <Label htmlFor="never" className="font-normal cursor-pointer">
                  Never
                </Label>
              </div>

              {/* On Date */}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="date" id="date" />
                <Label htmlFor="date" className="font-normal cursor-pointer">
                  On
                </Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setEndType("date");
                  }}
                  className="ml-2 flex-1"
                  disabled={endType !== "date"}
                />
              </div>

              {/* After Occurrences */}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="occurrences" id="occurrences" />
                <Label htmlFor="occurrences" className="font-normal cursor-pointer">
                  After
                </Label>
                <div className="relative flex items-center ml-2">
                  <Input
                    type="number"
                    min="1"
                    max="999"
                    value={endOccurrences}
                    onChange={(e) => {
                      setEndOccurrences(Math.max(1, parseInt(e.target.value) || 1));
                      setEndType("occurrences");
                    }}
                    className="w-20 pr-8 text-center"
                    disabled={endType !== "occurrences"}
                  />
                  <div className="absolute right-1 flex flex-col">
                    <button
                      type="button"
                      onClick={() => {
                        setEndOccurrences((prev) => Math.min(999, prev + 1));
                        setEndType("occurrences");
                      }}
                      className="h-4 w-6 flex items-center justify-center hover:bg-accent rounded-sm"
                      disabled={endType !== "occurrences"}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEndOccurrences((prev) => Math.max(1, prev - 1));
                        setEndType("occurrences");
                      }}
                      className="h-4 w-6 flex items-center justify-center hover:bg-accent rounded-sm"
                      disabled={endType !== "occurrences"}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">occurrences</span>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
