import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StopStatusBadge } from "@/components/StopStatusBadge";
import { PhoneCallMenu } from "@/components/PhoneCallMenu";
import { PhoneTextMenu } from "@/components/PhoneTextMenu";
import { CheckCircle2, XCircle, MessageSquare, Calendar, Trash2, Edit3, MapPin, Flag, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface DateInputProps {
  dateTypeName: string;
  initialValue: string;
  contactId: number;
}

function DateInput({ dateTypeName, initialValue, contactId }: DateInputProps) {
  const updateDateMutation = trpc.contacts.updateImportantDate.useMutation();

  return (
    <Input
      type="date"
      defaultValue={initialValue}
      className="h-7 text-xs flex-1"
      onBlur={(e) => {
        const newValue = e.target.value;
        updateDateMutation.mutate(
          {
            contactId,
            dateTypeName,
            date: newValue || null,
          },
          {
            onSuccess: () => {
              toast.success(`${dateTypeName} updated`);
            },
            onError: (error) => {
              toast.error(`Failed to update ${dateTypeName}`);
            },
          }
        );
      }}
    />
  );
}

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
  onGeocode?: () => void;
  onPositionChange?: (waypointId: number, newPosition: number) => void;
  totalStops?: number;
  labelColors?: Array<{ labelName: string; color: string }>;
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
  onGeocode,
  onPositionChange,
  totalStops,
  labelColors,
}: SortableWaypointItemProps) {

  // Fetch date types with showOnWaypoint flag
  const dateTypesQuery = trpc.settings.listImportantDateTypes.useQuery();
  const dateTypes = dateTypesQuery.data || [];
  const dateTypesToShow = dateTypes.filter(dt => dt.showOnWaypoint === 1);

  const phoneNumbers = waypoint.phoneNumbers ? JSON.parse(waypoint.phoneNumbers) : [];
  const isGapStop = waypoint.isGapStop === true || waypoint.isGapStop === 1;

  return (
    <div className={`border rounded-lg p-4 space-y-3 ${isGapStop ? 'bg-gray-50 border-gray-300' : 'bg-white'}`}>
      <div className="flex gap-3">
        {/* Contact photo or gap stop icon */}
        {waypoint.position !== 0 && (
          <div className="flex-shrink-0">
            {isGapStop ? (
              <img
                src="/gap-stop-marker.png"
                alt="Gap Stop"
                className="h-10 w-10 object-contain"
              />
            ) : waypoint.photoUrl ? (
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
                  if (totalStops && newPos >= 1 && newPos <= totalStops && onPositionChange) {
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
              // Extract label names from contactGroups/ format
              const extractedLabels = labels.map((label: string) => {
                if (label.startsWith('contactGroups/')) {
                  const parts = label.split('/');
                  return parts[parts.length - 1];
                }
                return label;
              });
              // Filter out system labels and hex IDs
              const filteredLabels = extractedLabels.filter((label: string) => {
                const lower = label.toLowerCase();
                // Filter out system labels and hex IDs (Google's internal group IDs)
                const isHexId = /^[0-9a-f]{12,}$/i.test(label);
                return lower !== 'mycontacts' && lower !== 'starred' && label.trim() !== '' && !isHexId;
              });
              
              // IMPORTANT: Sort labels - client labels (with colors) first, then regular labels
              const sortedLabels = labelColors ? filteredLabels.sort((a, b) => {
                const normalizeLabel = (label: string) => label.replace(/^\*/, '').toLowerCase().trim();
                const aHasColor = labelColors.some(lc => normalizeLabel(lc.labelName) === normalizeLabel(a));
                const bHasColor = labelColors.some(lc => normalizeLabel(lc.labelName) === normalizeLabel(b));
                if (aHasColor && !bHasColor) return -1;
                if (!aHasColor && bHasColor) return 1;
                return 0;
              }) : filteredLabels;
              
              if (sortedLabels.length === 0) return null;
              return (
                <div className="flex gap-1 flex-wrap mb-1">
                  {sortedLabels.map((label: string, idx: number) => (
                    <span key={idx} className="text-sm font-bold bg-primary/10 text-primary px-2 py-0.5 rounded whitespace-nowrap">
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
          {isGapStop ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">
                Duration: {waypoint.gapDuration} minutes
              </p>
              {waypoint.gapStopAddress && (
                <div className="flex items-start gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">
                      Off-Route: {waypoint.gapStopAddress}
                    </p>
                    {waypoint.gapStopMiles && (
                      <p className="text-xs text-muted-foreground">
                        {parseFloat(waypoint.gapStopMiles).toFixed(1)} miles ({waypoint.gapStopTripType === "round_trip" ? "Round Trip" : "One Way"})
                      </p>
                    )}
                  </div>
                </div>
              )}
              {waypoint.gapDescription && (
                <p className="text-sm text-muted-foreground">
                  {waypoint.gapDescription}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {waypoint.address}
            </p>
          )}
          
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
          {!isGapStop && phoneNumbers.length > 0 && (
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
      
      {/* Important Dates for Waypoint (editable) - Horizontal above buttons */}
      {!isGapStop && dateTypesToShow.length > 0 && (() => {
        // Parse existing dates
        let existingDates: any[] = [];
        try {
          if (waypoint.importantDates) {
            existingDates = JSON.parse(waypoint.importantDates);
          }
        } catch (e) {}

        return (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-3 flex-wrap">
              {dateTypesToShow.map((dateType) => {
                // Find existing date for this type
                const existingDate = existingDates.find((d: any) => d.type === dateType.name);
                const dateValue = existingDate ? existingDate.date.split('T')[0] : '';

                return (
                  <div key={dateType.id} className="flex items-center gap-2">
                    <label className="text-xs font-medium whitespace-nowrap">{dateType.name}:</label>
                    {waypoint.contactId ? (
                      <DateInput
                        dateTypeName={dateType.name}
                        initialValue={dateValue}
                        contactId={waypoint.contactId}
                      />
                    ) : (
                      <Input
                        type="date"
                        value={dateValue}
                        className="h-7 text-xs w-32"
                        disabled
                        placeholder="No contact linked"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
      
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
        {/* Show Fix Location button if coordinates are missing */}
        {(!waypoint.latitude || !waypoint.longitude) && onGeocode && (
          <Button
            size="sm"
            variant="outline"
            onClick={onGeocode}
            className="text-orange-600 hover:bg-orange-50"
          >
            <MapPin className="h-4 w-4 mr-1" />
            Fix Location
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Remove
        </Button>
        
        {/* Execution controls - only for regular stops, not gap stops */}
        {!isGapStop && (
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
