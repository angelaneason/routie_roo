import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { StopStatusBadge, type StopStatus } from "./StopStatusBadge";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, XCircle, Clock, Calendar, GripVertical, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Waypoint {
  id: number;
  waypointOrder: number;
  contactName: string | null;
  address: string;
  phoneNumbers: string | null;
  status: StopStatus;
  executionOrder: number | null;
  executionNotes: string | null;
  missedReason: string | null;
  rescheduledDate: Date | null;
  needsReschedule: number;
  completedAt: Date | null;
}

interface RouteExecutionPanelProps {
  routeId: number;
  waypoints: Waypoint[];
  onUpdate: () => void;
}

export function RouteExecutionPanel({ routeId, waypoints, onUpdate }: RouteExecutionPanelProps) {
  const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint | null>(null);
  const [actionType, setActionType] = useState<"complete" | "miss" | "note" | "reschedule" | null>(null);
  const [missedReason, setMissedReason] = useState("");
  const [executionNotes, setExecutionNotes] = useState("");
  const [rescheduledDate, setRescheduledDate] = useState("");

  const updateStatusMutation = trpc.routes.updateWaypointStatus.useMutation({
    onSuccess: () => {
      toast.success("Stop status updated");
      onUpdate();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const rescheduleMutation = trpc.routes.rescheduleWaypoint.useMutation({
    onSuccess: () => {
      toast.success("Stop rescheduled");
      onUpdate();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Failed to reschedule: ${error.message}`);
    },
  });

  const closeDialog = () => {
    setSelectedWaypoint(null);
    setActionType(null);
    setMissedReason("");
    setExecutionNotes("");
    setRescheduledDate("");
  };

  const handleComplete = (waypoint: Waypoint) => {
    setSelectedWaypoint(waypoint);
    setActionType("complete");
    setExecutionNotes(waypoint.executionNotes || "");
  };

  const handleMiss = (waypoint: Waypoint) => {
    setSelectedWaypoint(waypoint);
    setActionType("miss");
    setMissedReason(waypoint.missedReason || "");
  };

  const handleAddNote = (waypoint: Waypoint) => {
    setSelectedWaypoint(waypoint);
    setActionType("note");
    setExecutionNotes(waypoint.executionNotes || "");
  };

  const handleReschedule = (waypoint: Waypoint) => {
    setSelectedWaypoint(waypoint);
    setActionType("reschedule");
    setRescheduledDate(waypoint.rescheduledDate ? new Date(waypoint.rescheduledDate).toISOString().slice(0, 16) : "");
  };

  const handleSubmit = () => {
    if (!selectedWaypoint) return;

    if (actionType === "reschedule") {
      if (!rescheduledDate) {
        toast.error("Please select a reschedule date");
        return;
      }
      rescheduleMutation.mutate({
        waypointId: selectedWaypoint.id,
        rescheduledDate,
      });
    } else if (actionType === "complete") {
      updateStatusMutation.mutate({
        waypointId: selectedWaypoint.id,
        status: "complete",
        executionNotes: executionNotes || undefined,
      });
    } else if (actionType === "miss") {
      if (!missedReason.trim()) {
        toast.error("Please provide a reason for missing this stop");
        return;
      }
      updateStatusMutation.mutate({
        waypointId: selectedWaypoint.id,
        status: "missed",
        missedReason,
        executionNotes: executionNotes || undefined,
      });
    } else if (actionType === "note") {
      updateStatusMutation.mutate({
        waypointId: selectedWaypoint.id,
        status: selectedWaypoint.status,
        executionNotes: executionNotes || undefined,
      });
    }
  };

  const completedCount = waypoints.filter(w => w.status === "complete").length;
  const progressPercent = waypoints.length > 0 ? (completedCount / waypoints.length) * 100 : 0;

  // Sort waypoints by execution order if set, otherwise by waypoint order
  const sortedWaypoints = [...waypoints].sort((a, b) => {
    const orderA = a.executionOrder ?? a.waypointOrder;
    const orderB = b.executionOrder ?? b.waypointOrder;
    return orderA - orderB;
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Route Execution</span>
            <span className="text-sm font-normal text-muted-foreground">
              {completedCount} of {waypoints.length} stops complete
            </span>
          </CardTitle>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedWaypoints.map((waypoint, index) => (
            <div
              key={waypoint.id}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">Stop {index + 1}</span>
                    <StopStatusBadge status={waypoint.status} />
                    {waypoint.needsReschedule === 1 && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                        Needs Reschedule
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium">{waypoint.contactName || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">{waypoint.address}</p>
                  {waypoint.executionNotes && (
                    <div className="mt-2 text-sm bg-blue-50 p-2 rounded">
                      <p className="font-medium text-blue-900">Notes:</p>
                      <p className="text-blue-700">{waypoint.executionNotes}</p>
                    </div>
                  )}
                  {waypoint.missedReason && (
                    <div className="mt-2 text-sm bg-red-50 p-2 rounded">
                      <p className="font-medium text-red-900">Missed Reason:</p>
                      <p className="text-red-700">{waypoint.missedReason}</p>
                    </div>
                  )}
                  {waypoint.rescheduledDate && (
                    <div className="mt-2 text-sm bg-purple-50 p-2 rounded">
                      <p className="font-medium text-purple-900">Rescheduled for:</p>
                      <p className="text-purple-700">
                        {new Date(waypoint.rescheduledDate).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {waypoint.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleComplete(waypoint)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleMiss(waypoint)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Miss
                    </Button>
                  </>
                )}
                {waypoint.status === "missed" && waypoint.needsReschedule === 1 && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleReschedule(waypoint)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Reschedule
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddNote(waypoint)}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  {waypoint.executionNotes ? "Edit Note" : "Add Note"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!selectedWaypoint && !!actionType} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "complete" && "Complete Stop"}
              {actionType === "miss" && "Mark Stop as Missed"}
              {actionType === "note" && "Add Note"}
              {actionType === "reschedule" && "Reschedule Stop"}
            </DialogTitle>
            <DialogDescription>
              {selectedWaypoint?.contactName} - {selectedWaypoint?.address}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {actionType === "miss" && (
              <div className="space-y-2">
                <Label htmlFor="missed-reason">Reason for Missing Stop *</Label>
                <Textarea
                  id="missed-reason"
                  placeholder="e.g., Customer not home, gate locked, wrong address..."
                  value={missedReason}
                  onChange={(e) => setMissedReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {actionType === "reschedule" && (
              <div className="space-y-2">
                <Label htmlFor="reschedule-date">Reschedule Date and Time *</Label>
                <Input
                  id="reschedule-date"
                  type="datetime-local"
                  value={rescheduledDate}
                  onChange={(e) => setRescheduledDate(e.target.value)}
                />
              </div>
            )}

            {(actionType === "complete" || actionType === "note" || actionType === "miss") && (
              <div className="space-y-2">
                <Label htmlFor="execution-notes">
                  Notes {actionType === "note" ? "*" : "(Optional)"}
                </Label>
                <Textarea
                  id="execution-notes"
                  placeholder="Add any notes about this stop..."
                  value={executionNotes}
                  onChange={(e) => setExecutionNotes(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={updateStatusMutation.isPending || rescheduleMutation.isPending}
            >
              {updateStatusMutation.isPending || rescheduleMutation.isPending ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
