import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated?: () => void;
}

type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "custom";

export function AddEventDialog({ open, onOpenChange, onEventCreated }: AddEventDialogProps) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("10:00");
  const [allDay, setAllDay] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceType>("none");
  const [selectedCalendar, setSelectedCalendar] = useState("");
  const [description, setDescription] = useState("");
  const [customRecurrenceCount, setCustomRecurrenceCount] = useState("1");
  const [customRecurrenceUnit, setCustomRecurrenceUnit] = useState<"day" | "week" | "month">("week");
  const [customRecurrenceEnd, setCustomRecurrenceEnd] = useState<"never" | "on" | "after">("never");
  const [customRecurrenceEndDate, setCustomRecurrenceEndDate] = useState("");
  const [customRecurrenceOccurrences, setCustomRecurrenceOccurrences] = useState("10");
  const [showCustomRecurrence, setShowCustomRecurrence] = useState(false);

  const calendarsQuery = trpc.calendar.getCalendarList.useQuery();
  const createEventMutation = trpc.calendar.createEvent.useMutation({
    onSuccess: () => {
      toast.success("Event created successfully! 🦘");
      onEventCreated?.();
      handleClose();
    },
    onError: (error) => {
      toast.error(`Failed to create event: ${error.message}`);
    },
  });

  const handleClose = () => {
    setTitle("");
    setStartDate("");
    setStartTime("09:00");
    setEndDate("");
    setEndTime("10:00");
    setAllDay(false);
    setRecurrence("none");
    setSelectedCalendar("");
    setDescription("");
    setShowCustomRecurrence(false);
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Please enter an event title");
      return;
    }
    if (!startDate) {
      toast.error("Please select a start date");
      return;
    }
    if (!selectedCalendar) {
      toast.error("Please select a calendar");
      return;
    }

    // Build recurrence rule if needed
    let recurrenceRule = "";
    if (recurrence === "daily") {
      recurrenceRule = "RRULE:FREQ=DAILY";
    } else if (recurrence === "weekly") {
      recurrenceRule = "RRULE:FREQ=WEEKLY";
    } else if (recurrence === "monthly") {
      recurrenceRule = "RRULE:FREQ=MONTHLY";
    } else if (recurrence === "custom") {
      const freq = customRecurrenceUnit === "day" ? "DAILY" : customRecurrenceUnit === "week" ? "WEEKLY" : "MONTHLY";
      recurrenceRule = `RRULE:FREQ=${freq};INTERVAL=${customRecurrenceCount}`;
      
      if (customRecurrenceEnd === "on" && customRecurrenceEndDate) {
        const endDateFormatted = customRecurrenceEndDate.replace(/-/g, "");
        recurrenceRule += `;UNTIL=${endDateFormatted}`;
      } else if (customRecurrenceEnd === "after") {
        recurrenceRule += `;COUNT=${customRecurrenceOccurrences}`;
      }
    }

    createEventMutation.mutate({
      title,
      startDate,
      startTime: allDay ? undefined : startTime,
      endDate: endDate || startDate,
      endTime: allDay ? undefined : endTime,
      allDay,
      calendarId: selectedCalendar,
      description,
      recurrence: recurrenceRule || undefined,
    });
  };

  const calendars = calendarsQuery.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="event-title">Title *</Label>
            <Input
              id="event-title"
              placeholder="Add title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date *</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (!endDate) setEndDate(e.target.value);
                }}
              />
            </div>
            {!allDay && (
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {!allDay && (
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* All Day */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="all-day"
              checked={allDay}
              onCheckedChange={(checked) => setAllDay(checked as boolean)}
            />
            <label htmlFor="all-day" className="text-sm cursor-pointer">
              All day
            </label>
          </div>

          {/* Recurrence */}
          <div className="space-y-2">
            <Label htmlFor="recurrence">Recurrence</Label>
            <Select
              value={recurrence}
              onValueChange={(value: RecurrenceType) => {
                setRecurrence(value);
                if (value === "custom") {
                  setShowCustomRecurrence(true);
                } else {
                  setShowCustomRecurrence(false);
                }
              }}
            >
              <SelectTrigger id="recurrence">
                <SelectValue placeholder="Does not repeat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Does not repeat</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="custom">Custom...</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Recurrence */}
          {showCustomRecurrence && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium">Custom Recurrence</h4>
              
              <div className="flex items-center gap-2">
                <Label>Repeat every</Label>
                <Input
                  type="number"
                  min="1"
                  value={customRecurrenceCount}
                  onChange={(e) => setCustomRecurrenceCount(e.target.value)}
                  className="w-20"
                />
                <Select value={customRecurrenceUnit} onValueChange={(value: "day" | "week" | "month") => setCustomRecurrenceUnit(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">day(s)</SelectItem>
                    <SelectItem value="week">week(s)</SelectItem>
                    <SelectItem value="month">month(s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ends</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ends-never"
                      checked={customRecurrenceEnd === "never"}
                      onCheckedChange={(checked) => checked && setCustomRecurrenceEnd("never")}
                    />
                    <label htmlFor="ends-never" className="text-sm cursor-pointer">
                      Never
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ends-on"
                      checked={customRecurrenceEnd === "on"}
                      onCheckedChange={(checked) => checked && setCustomRecurrenceEnd("on")}
                    />
                    <label htmlFor="ends-on" className="text-sm cursor-pointer">
                      On
                    </label>
                    {customRecurrenceEnd === "on" && (
                      <Input
                        type="date"
                        value={customRecurrenceEndDate}
                        onChange={(e) => setCustomRecurrenceEndDate(e.target.value)}
                        className="w-40"
                      />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ends-after"
                      checked={customRecurrenceEnd === "after"}
                      onCheckedChange={(checked) => checked && setCustomRecurrenceEnd("after")}
                    />
                    <label htmlFor="ends-after" className="text-sm cursor-pointer">
                      After
                    </label>
                    {customRecurrenceEnd === "after" && (
                      <>
                        <Input
                          type="number"
                          min="1"
                          value={customRecurrenceOccurrences}
                          onChange={(e) => setCustomRecurrenceOccurrences(e.target.value)}
                          className="w-20"
                        />
                        <span className="text-sm">occurrences</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Calendar Selector */}
          <div className="space-y-2">
            <Label htmlFor="calendar">Calendar *</Label>
            <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
              <SelectTrigger id="calendar">
                <SelectValue placeholder="Select calendar" />
              </SelectTrigger>
              <SelectContent>
                {calendars.map((calendar: any) => (
                  <SelectItem key={calendar.id} value={calendar.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: calendar.backgroundColor || "#3b82f6" }}
                      />
                      {calendar.summary}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createEventMutation.isPending}>
              {createEventMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
