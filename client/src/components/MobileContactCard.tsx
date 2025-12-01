import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PhoneCallMenu } from "@/components/PhoneCallMenu";
import { PhoneTextMenu } from "@/components/PhoneTextMenu";
import { 
  AlertCircle, 
  Edit, 
  Eye, 
  EyeOff, 
  Info, 
  Paperclip,
  Phone,
  MessageSquare,
  Navigation
} from "lucide-react";

interface Contact {
  id: number;
  name: string | null;
  address: string | null;
  photoUrl: string | null;
  phoneNumbers: string | null;
  labels: string | null;
  importantDates: string | null;
  comments: string | null;
  isActive: number;
}

interface MobileContactCardProps {
  contact: Contact;
  isSelected: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onViewDetails: () => void;
  onUploadDocument: () => void;
  onToggleActive: () => void;
  preferredCallingService?: string;
}

export function MobileContactCard({
  contact,
  isSelected,
  onToggle,
  onEdit,
  onViewDetails,
  onUploadDocument,
  onToggleActive,
  preferredCallingService = "phone"
}: MobileContactCardProps) {
  const [showAllDetails, setShowAllDetails] = useState(false);

  // Parse phone numbers
  const phones = contact.phoneNumbers ? (() => {
    try {
      return JSON.parse(contact.phoneNumbers);
    } catch (e) {
      return [];
    }
  })() : [];

  // Parse labels
  const labels = contact.labels ? (() => {
    try {
      const parsed = JSON.parse(contact.labels);
      return parsed.filter((label: string) => {
        const lower = label.toLowerCase();
        return lower !== 'mycontacts' && 
               lower !== 'starred' && 
               !label.startsWith('contactGroups/');
      });
    } catch (e) {
      return [];
    }
  })() : [];

  // Parse important dates
  const dates = contact.importantDates ? (() => {
    try {
      return JSON.parse(contact.importantDates);
    } catch (e) {
      return [];
    }
  })() : [];

  // Parse comments
  const comments = contact.comments ? (() => {
    try {
      return JSON.parse(contact.comments);
    } catch (e) {
      return [];
    }
  })() : [];

  const hasAddress = contact.address && contact.address.trim() !== "";
  const primaryPhone = phones[0];

  return (
    <div 
      className="bg-card rounded-lg border shadow-sm overflow-hidden touch-target"
      onClick={onToggle}
    >
      {/* Main Card Content */}
      <div className="p-4">
        {/* Header Row */}
        <div className="flex items-start gap-3 mb-3">
          {/* Checkbox */}
          <div className="pt-1" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggle}
              className="touch-target"
            />
          </div>

          {/* Photo/Avatar */}
          <div className="flex-shrink-0">
            {contact.photoUrl ? (
              <img
                src={contact.photoUrl}
                alt={contact.name || "Contact"}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-medium text-primary">
                  {(contact.name || "?").charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Name and Labels */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base truncate">{contact.name}</h3>
              {!hasAddress && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>No address</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Labels */}
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {labels.slice(0, 2).map((label: string, idx: number) => (
                  <span 
                    key={idx} 
                    className="inline-block px-2 py-0.5 text-xs font-bold bg-primary/10 text-primary rounded"
                  >
                    {label}
                  </span>
                ))}
                {labels.length > 2 && (
                  <span className="inline-block px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded">
                    +{labels.length - 2}
                  </span>
                )}
              </div>
            )}

            {/* Address */}
            <p className="text-sm text-muted-foreground truncate">
              {contact.address || "No address"}
            </p>
          </div>
        </div>

        {/* Quick Action Buttons - Mobile Optimized */}
        <div className="flex gap-2 mb-3" onClick={(e) => e.stopPropagation()}>
          {/* Primary Phone Actions */}
          {primaryPhone && (
            <>
              <Button
                variant="default"
                size="sm"
                className="flex-1 touch-target"
                onClick={() => {
                  const cleanNumber = primaryPhone.value.replace(/\D/g, '');
                  const url = preferredCallingService === 'phone' 
                    ? `tel:+1${cleanNumber}`
                    : preferredCallingService === 'google-voice'
                    ? `https://voice.google.com/u/0/calls?a=nc,%2B1${cleanNumber}`
                    : `tel:+1${cleanNumber}`;
                  window.open(url, '_blank');
                }}
              >
                <Phone className="h-4 w-4 mr-1" />
                Call
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="flex-1 touch-target"
                onClick={() => {
                  const cleanNumber = primaryPhone.value.replace(/\D/g, '');
                  window.open(`sms:+1${cleanNumber}`, '_blank');
                }}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Text
              </Button>
            </>
          )}

          {/* Navigate Button */}
          {hasAddress && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 touch-target"
              onClick={() => {
                const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(contact.address || '')}`;
                window.open(mapsUrl, '_blank');
              }}
            >
              <Navigation className="h-4 w-4 mr-1" />
              Navigate
            </Button>
          )}
        </div>

        {/* Expandable Details */}
        {(dates.length > 0 || comments.length > 0 || phones.length > 1) && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setShowAllDetails(!showAllDetails);
            }}
          >
            {showAllDetails ? "Show Less" : "Show More Details"}
          </Button>
        )}

        {/* Expanded Details */}
        {showAllDetails && (
          <div className="mt-3 pt-3 border-t space-y-3" onClick={(e) => e.stopPropagation()}>
            {/* All Phone Numbers */}
            {phones.length > 1 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Phone Numbers:</p>
                <div className="space-y-1">
                  {phones.map((phone: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <PhoneCallMenu 
                        phoneNumber={phone.value}
                        label={`${phone.value} ${phone.label ? `(${phone.label})` : ''}`}
                        variant="ghost"
                        size="sm"
                        className="flex-1 justify-start text-xs"
                        preferredService={preferredCallingService}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Important Dates */}
            {dates.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Important Dates:</p>
                {dates.map((date: any, idx: number) => (
                  <div key={idx} className="text-xs text-muted-foreground">
                    <span className="font-medium">{date.type}:</span> {new Date(date.date).toLocaleDateString()}
                  </div>
                ))}
              </div>
            )}

            {/* Comments */}
            {comments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Comments:</p>
                {comments.map((comment: any, idx: number) => (
                  <div key={idx} className="text-xs text-muted-foreground">
                    {comment.option === "Other" ? comment.customText : comment.option}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Bar at Bottom */}
      <div className="flex border-t bg-muted/30" onClick={(e) => e.stopPropagation()}>
        {!hasAddress && (
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 rounded-none touch-target"
            onClick={onEdit}
          >
            Add Address
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 rounded-none touch-target"
          onClick={onViewDetails}
        >
          <Info className="h-4 w-4 mr-1" />
          Details
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 rounded-none touch-target"
          onClick={onUploadDocument}
        >
          <Paperclip className="h-4 w-4 mr-1" />
          Docs
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 rounded-none touch-target"
          onClick={onEdit}
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 rounded-none touch-target"
          onClick={onToggleActive}
        >
          {contact.isActive === 1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
