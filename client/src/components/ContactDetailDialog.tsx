import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, User, Paperclip, MapPin } from "lucide-react";
import { getAllAddresses, getAddressTypeIcon, getAddressTypeLabel } from "@/lib/addressHelpers";
import { DocumentsTab } from "./DocumentsTab";

interface ContactDetailDialogProps {
  contact: {
    id: number;
    name: string | null;
    email: string | null;
    address: string | null;
    addresses: string | null;
    phoneNumbers: string | null;
    importantDates: string | null;
    comments: string | null;
    labels: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

export function ContactDetailDialog({
  contact,
  open,
  onOpenChange,
  onEdit,
}: ContactDetailDialogProps) {
  if (!contact) return null;

  const parsePhones = () => {
    try {
      return contact.phoneNumbers ? JSON.parse(contact.phoneNumbers) : [];
    } catch {
      return [];
    }
  };

  const parseDates = () => {
    try {
      return contact.importantDates ? JSON.parse(contact.importantDates) : [];
    } catch {
      return [];
    }
  };

  const parseComments = () => {
    try {
      return contact.comments ? JSON.parse(contact.comments) : [];
    } catch {
      return [];
    }
  };

  const parseLabels = () => {
    try {
      return contact.labels ? JSON.parse(contact.labels) : [];
    } catch {
      return [];
    }
  };

  const phones = parsePhones();
  const dates = parseDates();
  const comments = parseComments();
  const labels = parseLabels();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{contact.name || "Contact Details"}</DialogTitle>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                Edit Contact
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="info" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">
              <User className="h-4 w-4 mr-2" />
              Contact Info
            </TabsTrigger>
            <TabsTrigger value="documents">
              <Paperclip className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="info" className="space-y-4 m-0">
              {/* Email */}
              {contact.email && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{contact.email}</p>
                </div>
              )}

              {/* Addresses */}
              {(() => {
                const addresses = getAllAddresses(contact.addresses);
                const legacyAddress = contact.address;
                
                // Show addresses array if available, otherwise fall back to legacy address
                if (addresses.length > 0) {
                  return (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {addresses.length > 1 ? 'Addresses' : 'Address'}
                      </label>
                      <div className="space-y-2 mt-1">
                        {addresses.map((addr, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="text-lg mt-0.5">{getAddressTypeIcon(addr.type)}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-muted-foreground uppercase">
                                  {getAddressTypeLabel(addr.type)}
                                </span>
                                {addr.isPrimary && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                    Primary
                                  </span>
                                )}
                              </div>
                              <p className="text-sm mt-0.5">{addr.formattedValue}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                } else if (legacyAddress) {
                  return (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Address</label>
                      <p className="text-sm">{legacyAddress}</p>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Phone Numbers */}
              {phones.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone Numbers</label>
                  <div className="space-y-1 mt-1">
                    {phones.map((phone: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        {phone.number}
                        {phone.label && (
                          <span className="text-muted-foreground ml-2">({phone.label})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Important Dates */}
              {dates.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Important Dates</label>
                  <div className="space-y-1 mt-1">
                    {dates.map((date: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        <span className="font-medium">{date.type}:</span> {date.date}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Labels */}
              {labels.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Labels</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {labels.map((label: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              {comments.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Comments</label>
                  <div className="space-y-1 mt-1">
                    {comments.map((comment: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        {comment.option}
                        {comment.customText && (
                          <span className="text-muted-foreground ml-2">- {comment.customText}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents" className="m-0">
              <DocumentsTab contactId={contact.id} contactName={contact.name || "Contact"} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
