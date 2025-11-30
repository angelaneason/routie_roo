import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: any | null;
  onEventUpdated: () => void;
}

export function EditEventDialog({ open, onOpenChange, event, onEventUpdated }: EditEventDialogProps) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const updateMutation = trpc.calendar.updateEvent.useMutation({
    onSuccess: () => {
      toast.success("Event updated successfully");
      onEventUpdated();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update event");
    },
  });

  // Populate form when event changes
  useEffect(() => {
    if (event) {
      setTitle(event.summary || "");
      setLocation(event.location || "");
      setDescription(event.description || "");

      if (event.start) {
        const startDateTime = new Date(event.start);
        setStartDate(startDateTime.toISOString().split('T')[0]);
        setStartTime(startDateTime.toTimeString().slice(0, 5));
      }

      if (event.end) {
        const endDateTime = new Date(event.end);
        setEndDate(endDateTime.toISOString().split('T')[0]);
        setEndTime(endDateTime.toTimeString().slice(0, 5));
      }
    }
  }, [event]);

  const handleSubmit = () => {
    if (!event?.googleEventId || !event?.calendarId) {
      toast.error("Missing event information");
      return;
    }

    if (!title.trim()) {
      toast.error("Event title is required");
      return;
    }

    // Build ISO datetime strings
    const startISO = startDate && startTime ? `${startDate}T${startTime}:00` : undefined;
    const endISO = endDate && endTime ? `${endDate}T${endTime}:00` : undefined;

    updateMutation.mutate({
      eventId: event.googleEventId,
      calendarId: event.calendarId,
      summary: title,
      description: description || undefined,
      start: startISO,
      end: endISO,
      location: location || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Event location"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event description"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
