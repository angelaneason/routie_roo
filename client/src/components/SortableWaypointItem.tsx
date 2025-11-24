import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { StopStatusBadge } from "@/components/StopStatusBadge";
import { PhoneCallMenu } from "@/components/PhoneCallMenu";
import { PhoneTextMenu } from "@/components/PhoneTextMenu";
import { CheckCircle2, XCircle, MessageSquare, Calendar, GripVertical, Trash2, Edit3, MapPin } from "lucide-react";

interface SortableWaypointItemProps {
  waypoint: any;
  index: number;
  onComplete: () => void;
  onMiss: () => void;
  onNote: () => void;
  onReschedule: () => void;
  isEditMode?: boolean;
  onRemove?: () => void;
  onEditAddress?: () => void;
}

export function SortableWaypointItem({
  waypoint,
  index,
  onComplete,
  onMiss,
  onNote,
  onReschedule,
  isEditMode = false,
  onRemove,
  onEditAddress,
}: SortableWaypointItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: waypoint.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const phoneNumbers = waypoint.phoneNumbers ? JSON.parse(waypoint.phoneNumbers) : [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded-lg p-4 space-y-3 bg-white"
    >
      <div className="flex gap-3">
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {waypoint.contactName && (
              <p className="font-medium">{waypoint.contactName}</p>
            )}
            <StopStatusBadge status={waypoint.status || "pending"} />
            {waypoint.needsReschedule === 1 && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                Needs Reschedule
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs ml-auto"
              onClick={() => {
                const encodedAddress = encodeURIComponent(waypoint.address);
                window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, "_blank");
              }}
              title="Open in Google Maps"
            >
              <MapPin className="h-3 w-3 mr-1" />
              Maps
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {waypoint.address}
          </p>
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
          {phoneNumbers.length > 0 && (
            <div className="mt-2 space-y-2">
              {phoneNumbers.map((phone: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    📞 {phone.value} {phone.label || phone.type ? `(${phone.label || phone.type})` : ''}
                  </p>
                  <div className="flex gap-2">
                    <PhoneCallMenu
                      phoneNumber={phone.value}
                      label="Call"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                    />
                    <PhoneTextMenu
                      phoneNumber={phone.value}
                      label="Text"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex gap-2 flex-wrap pt-2 border-t">
        {isEditMode ? (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={onEditAddress}
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Edit Address
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </>
        ) : (
          <>
            {waypoint.status === "pending" && (
              <>
                <Button
                  size="sm"
                  onClick={onComplete}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Complete
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onMiss}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Miss
                </Button>
              </>
            )}
            {waypoint.status === "missed" && waypoint.needsReschedule === 1 && (
              <Button
                size="sm"
                onClick={onReschedule}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Calendar className="h-4 w-4 mr-1" />
                Reschedule
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onNote}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              {waypoint.executionNotes ? "Edit Note" : "Add Note"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
