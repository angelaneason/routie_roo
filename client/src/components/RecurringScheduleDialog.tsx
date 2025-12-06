import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

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
    routeHolderSchedule?: Record<string, number>; // { "Monday": 1, "Wednesday": 2 }
  };
  onSave: (schedule: {
    repeatInterval: number;
    repeatDays: string[];
    scheduleEndType: "never" | "date" | "occurrences";
    scheduleEndDate?: string;
    scheduleEndOccurrences?: number;
    routeHolderSchedule?: Record<string, number>;
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
  const [routeHolderSchedule, setRouteHolderSchedule] = useState<Record<string, number>>(
    initialSchedule?.routeHolderSchedule || {}
  );

  // Fetch route holders
  const { data: routeHolders } = trpc.routeHolders.list.useQuery();

  // Reset state when initialSchedule changes (when switching contacts)
  useEffect(() => {
    setRepeatInterval(initialSchedule?.repeatInterval || 1);
    setSelectedDays(initialSchedule?.repeatDays || []);
    setEndType(initialSchedule?.scheduleEndType || "never");
    setEndDate(initialSchedule?.scheduleEndDate || "");
    setEndOccurrences(initialSchedule?.scheduleEndOccurrences || 13);
    setRouteHolderSchedule(initialSchedule?.routeHolderSchedule || {});
  }, [initialSchedule]);

  const handleDayToggle = (dayFull: string) => {
    setSelectedDays((prev) => {
      const newDays = prev.includes(dayFull) 
        ? prev.filter((d) => d !== dayFull) 
        : [...prev, dayFull];
      
      // Remove route holder assignment if day is deselected
      if (!newDays.includes(dayFull)) {
        setRouteHolderSchedule((prevSchedule) => {
          const newSchedule = { ...prevSchedule };
          delete newSchedule[dayFull];
          return newSchedule;
        });
      }
      
      return newDays;
    });
  };

  const handleRouteHolderChange = (day: string, holderId: string) => {
    if (holderId === "none") {
      setRouteHolderSchedule((prev) => {
        const newSchedule = { ...prev };
        delete newSchedule[day];
        return newSchedule;
      });
    } else {
      setRouteHolderSchedule((prev) => ({
        ...prev,
        [day]: parseInt(holderId),
      }));
    }
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
      routeHolderSchedule: Object.keys(routeHolderSchedule).length > 0 ? routeHolderSchedule : undefined,
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
    setRouteHolderSchedule(initialSchedule?.routeHolderSchedule || {});
    onOpenChange(false);
  };

  const getRouteHolderForDay = (day: string) => {
    const holderId = routeHolderSchedule[day];
    if (!holderId) return null;
    return routeHolders?.find((h: any) => h.id === holderId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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

          {/* Route Holder Assignment */}
          {selectedDays.length > 0 && routeHolders && routeHolders.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">Assign Route Holders (Optional)</Label>
              <div className="space-y-2">
                {selectedDays.map((day) => {
                  const holder = getRouteHolderForDay(day);
                  return (
                    <div key={day} className="flex items-center gap-3">
                      <div className="w-24 text-sm font-medium">{day}</div>
                      <Select
                        value={routeHolderSchedule[day]?.toString() || "none"}
                        onValueChange={(value) => handleRouteHolderChange(day, value)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="No holder assigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No holder assigned</SelectItem>
                          {routeHolders.map((h: any) => (
                            <SelectItem key={h.id} value={h.id.toString()}>
                              {h.name}
                              {h.defaultStopType && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({h.defaultStopType})
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {holder && holder.defaultStopTypeColor && (
                        <div
                          className="w-4 h-4 rounded flex-shrink-0"
                          style={{ backgroundColor: holder.defaultStopTypeColor }}
                          title={holder.defaultStopType || ""}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Routes will be assigned to the selected holder and saved to their calendar
              </p>
            </div>
          )}

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
