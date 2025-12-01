import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StopStatusBadge } from "@/components/StopStatusBadge";
import { PhoneCallMenu } from "@/components/PhoneCallMenu";
import { PhoneTextMenu } from "@/components/PhoneTextMenu";
import { CheckCircle2, XCircle, MessageSquare, Calendar, Trash2, Edit3, MapPin, Flag } from "lucide-react";

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
  onEdit?: () => void;
  onPositionChange?: (waypointId: number, newPosition: number) => void;
  totalStops: number;
}

// Contact photo display added
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
  onEdit,
  onPositionChange,
  totalStops,
}: SortableWaypointItemProps) {

  const phoneNumbers = waypoint.phoneNumbers ? JSON.parse(waypoint.phoneNumbers) : [];

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-white">
      <div className="flex gap-3">
        {/* Contact photo */}
        {waypoint.position !== 0 && (
          <div className="flex-shrink-0">
            {waypoint.photoUrl ? (
              <img
                src={waypoint.photoUrl}
                alt={waypoint.contactName || "Contact"}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {(waypoint.contactName || "?").charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        )}
        {/* Stop number input */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          {waypoint.position === 0 ? (
            <div className="w-12 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Flag className="h-4 w-4" />
            </div>
          ) : (
            <>
              <Input
                type="number"
                min="1"
                max={totalStops}
                value={index}
                onChange={(e) => {
                  const newPos = parseInt(e.target.value);
                  if (newPos >= 1 && newPos <= totalStops && onPositionChange) {
                    onPositionChange(waypoint.id, newPos);
                  }
                }}
                className="w-12 h-8 text-center text-sm font-medium p-0"
              />
              <span className="text-xs text-muted-foreground">Stop</span>
            </>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {/* Stop type shown first and always visible */}
            <span 
              className="text-xs px-2 py-0.5 rounded font-medium text-white"
              style={{ backgroundColor: waypoint.stopColor || "#3b82f6" }}
            >
              {waypoint.stopType ? (waypoint.stopType.charAt(0).toUpperCase() + waypoint.stopType.slice(1)) : "Visit"}
            </span>
            {waypoint.contactName && (
              <p className="font-medium">{waypoint.contactName}</p>
            )}
            <StopStatusBadge status={waypoint.status || "pending"} />
            {waypoint.needsReschedule === 1 && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                Needs Reschedule
              </span>
            )}
          </div>
          {/* Contact labels under name */}
          {waypoint.contactLabels && (() => {
            try {
              const labels = JSON.parse(waypoint.contactLabels);
              const filteredLabels = labels.filter((label: string) => {
                const lower = label.toLowerCase();
                return lower !== 'mycontacts' && lower !== 'starred' && !label.startsWith('contactGroups/');
              });
              if (filteredLabels.length === 0) return null;
              return (
                <div className="flex gap-1 flex-wrap mb-1">
                  {filteredLabels.map((label: string) => (
                    <span key={label} className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {label}
                    </span>
                  ))}
                </div>
              );
            } catch {
              return null;
            }
          })()}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
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
          
          {/* Important Dates */}
          {waypoint.importantDates && (() => {
            try {
              const dates = JSON.parse(waypoint.importantDates);
              if (dates.length > 0) {
                return (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Important Dates:</p>
                    {dates.map((date: any, idx: number) => (
                      <div key={idx} className="text-xs text-muted-foreground">
                        <span className="font-medium">{date.type}:</span> {new Date(date.date).toLocaleDateString()}
                      </div>
                    ))}
                  </div>
                );
              }
            } catch (e) {}
            return null;
          })()}
          
          {/* Comments */}
          {waypoint.comments && (() => {
            try {
              const comments = JSON.parse(waypoint.comments);
              if (comments.length > 0) {
                return (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Comments:</p>
                    {comments.map((comment: any, idx: number) => (
                      <div key={idx} className="text-xs text-muted-foreground">
                        {comment.option === "Other" ? comment.customText : comment.option}
                      </div>
                    ))}
                  </div>
                );
              }
            } catch (e) {}
            return null;
          })()}
          
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
                    {phone.value} {phone.label || phone.type ? `(${phone.label || phone.type})` : ''}
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
        {/* Edit controls - always visible */}
        <Button
          size="sm"
          variant="outline"
          onClick={onEdit}
        >
          <Edit3 className="h-4 w-4 mr-1" />
          Edit Details
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Remove
        </Button>
        
        {/* Execution controls */}
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
      </div>
    </div>
  );
}
