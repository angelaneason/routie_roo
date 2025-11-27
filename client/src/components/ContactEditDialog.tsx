import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Calendar and Popover imports removed - using native date input instead

import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIconLucide, MessageSquare, Plus, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface PhoneNumber {
  value: string;
  label: string;
}

interface ImportantDate {
  type: string;
  date: string;
}

interface Comment {
  option: string;
  customText?: string;
}

interface ContactEditDialogProps {
  contact: {
    id: number;
    name: string | null;
    email: string | null;
    address: string | null;
    phoneNumbers: string | null;
    importantDates: string | null;
    comments: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    name: string;
    email: string;
    address: string;
    phoneNumbers: PhoneNumber[];
    importantDates?: ImportantDate[];
    comments?: Comment[];
  }) => Promise<void>;
}

export function ContactEditDialog({ contact, open, onOpenChange, onSave }: ContactEditDialogProps) {
  const initialPhones: PhoneNumber[] = contact.phoneNumbers 
    ? JSON.parse(contact.phoneNumbers) 
    : [];
    
  const initialDates: ImportantDate[] = contact.importantDates
    ? JSON.parse(contact.importantDates)
    : [];
    
  const initialComments: Comment[] = contact.comments
    ? JSON.parse(contact.comments)
    : [];
    
  const [name, setName] = useState(contact.name || "");
  const [email, setEmail] = useState(contact.email || "");
  const [address, setAddress] = useState(contact.address || "");
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>(initialPhones);
  const [importantDates, setImportantDates] = useState<ImportantDate[]>(initialDates);
  // Removed openPopoverIndex state - using native date input instead
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  
  // Fetch date types and comment options from settings
  const dateTypesQuery = trpc.settings.listImportantDateTypes.useQuery();
  const commentOptionsQuery = trpc.settings.listCommentOptions.useQuery();
  
  const validateAddressMutation = trpc.contacts.validateAddress.useMutation({
    onSuccess: (result) => {
      if (result.isValid && result.formattedAddress) {
        toast.success(
          `Address validated! ${result.formattedAddress}`,
          {
            action: {
              label: "Use This",
              onClick: () => setAddress(result.formattedAddress!),
            },
          }
        );
      } else if (result.error) {
        toast.error(result.error);
      }
      setValidating(false);
    },
    onError: (error) => {
      toast.error(`Validation failed: ${error.message}`);
      setValidating(false);
    },
  });
  
  const handleValidateAddress = () => {
    if (!address || address.trim().length === 0) {
      toast.error("Please enter an address first");
      return;
    }
    setValidating(true);
    validateAddressMutation.mutate({ address });
  };

  const addPhoneNumber = () => {
    setPhoneNumbers([...phoneNumbers, { value: "", label: "mobile" }]);
  };

  const removePhoneNumber = (index: number) => {
    setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
  };

  const updatePhoneNumber = (index: number, field: "value" | "label", value: string) => {
    const updated = [...phoneNumbers];
    updated[index] = { ...updated[index], [field]: value };
    setPhoneNumbers(updated);
  };
  
  const addImportantDate = () => {
    const firstDateType = dateTypesQuery.data?.[0]?.name || "";
    setImportantDates([...importantDates, { type: firstDateType, date: "" }]);
  };
  
  const removeImportantDate = (index: number) => {
    setImportantDates(importantDates.filter((_, i) => i !== index));
  };
  
  const updateImportantDate = (index: number, field: "type" | "date", value: string) => {
    const updated = [...importantDates];
    updated[index] = { ...updated[index], [field]: value };
    setImportantDates(updated);
  };
  
  const addComment = () => {
    const firstOption = commentOptionsQuery.data?.[0]?.option || "Other";
    setComments([...comments, { option: firstOption, customText: "" }]);
  };
  
  const removeComment = (index: number) => {
    setComments(comments.filter((_, i) => i !== index));
  };
  
  const updateComment = (index: number, field: "option" | "customText", value: string) => {
    const updated = [...comments];
    updated[index] = { ...updated[index], [field]: value };
    setComments(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    
    // Validate important dates
    const validDates = importantDates.filter(d => d.type && d.date);
    
    // Validate comments
    const validComments = comments.filter(c => {
      if (c.option === "Other") {
        return c.customText && c.customText.trim();
      }
      return c.option;
    });


    
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        email: email.trim(),
        address: address.trim(),
        phoneNumbers: phoneNumbers.filter(p => p.value.trim()),
        importantDates: validDates,
        comments: validComments,
      });
      toast.success("Contact updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update contact");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>
            Update contact information. Changes will be synced back to Google Contacts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm !font-bold">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contact name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm !font-bold">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm !font-bold">Address</Label>
            <div className="flex gap-2">
              <AddressAutocomplete
                id="address"
                value={address}
                onChange={setAddress}
                placeholder="Start typing address for suggestions..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleValidateAddress}
                disabled={validating || !address}
                className="shrink-0"
              >
                {validating ? (
                  <>
                    <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Validating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Validate
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm !font-bold">Phone Numbers</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPhoneNumber}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Phone
              </Button>
            </div>

            {phoneNumbers.map((phone, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    value={phone.value}
                    onChange={(e) => updatePhoneNumber(index, "value", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <select
                  value={phone.label}
                  onChange={(e) => updatePhoneNumber(index, "label", e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="mobile">Mobile</option>
                  <option value="work">Work</option>
                  <option value="home">Home</option>
                  <option value="other">Other</option>
                </select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removePhoneNumber(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {phoneNumbers.length === 0 && (
              <p className="text-sm text-muted-foreground">No phone numbers added</p>
            )}
          </div>
          
          {/* Important Dates Section */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm !font-bold flex items-center gap-2">
                <CalendarIconLucide className="h-4 w-4" />
                Important Dates
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addImportantDate}
                disabled={!dateTypesQuery.data || dateTypesQuery.data.length === 0}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Date
              </Button>
            </div>
            
            {!dateTypesQuery.data || dateTypesQuery.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No date types configured. Add date types in Settings first.
              </p>
            ) : (
              <>
                {importantDates.map((date, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <Select
                      value={date.type}
                      onValueChange={(value) => updateImportantDate(index, "type", value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {dateTypesQuery.data?.map((dateType) => (
                          <SelectItem key={dateType.id} value={dateType.name}>
                            {dateType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input
                      type="date"
                      value={date.date || ""}
                      onChange={(e) => updateImportantDate(index, "date", e.target.value)}
                      className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeImportantDate(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {importantDates.length === 0 && (
                  <p className="text-sm text-muted-foreground">No important dates added</p>
                )}
              </>
            )}
          </div>
          
          {/* Comments Section */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm !font-bold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addComment}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Comment
              </Button>
            </div>
            
            {comments.map((comment, index) => (
              <div key={index} className="space-y-2">
                <div className="flex gap-2 items-start">
                  <Select
                    value={comment.option}
                    onValueChange={(value) => updateComment(index, "option", value)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      {commentOptionsQuery.data?.map((option) => (
                        <SelectItem key={option.id} value={option.option}>
                          {option.option}
                        </SelectItem>
                      ))}
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeComment(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {comment.option === "Other" && (
                  <Input
                    value={comment.customText || ""}
                    onChange={(e) => updateComment(index, "customText", e.target.value)}
                    placeholder="Enter custom comment"
                    className="ml-0"
                  />
                )}
              </div>
            ))}
            
            {comments.length === 0 && (
              <p className="text-sm text-muted-foreground">No comments added</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
