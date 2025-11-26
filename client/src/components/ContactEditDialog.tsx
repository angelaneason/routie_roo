import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIconLucide, MessageSquare, Plus, X } from "lucide-react";
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
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [saving, setSaving] = useState(false);
  
  // Fetch date types and comment options from settings
  const dateTypesQuery = trpc.settings.listImportantDateTypes.useQuery();
  const commentOptionsQuery = trpc.settings.listCommentOptions.useQuery();

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
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City, State ZIP"
              rows={3}
            />
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
                <Calendar className="h-4 w-4" />
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex-1 justify-start text-left font-normal"
                        >
                          <CalendarIconLucide className="mr-2 h-4 w-4" />
                          {date.date ? format(new Date(date.date), "MM/dd/yyyy") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date.date ? new Date(date.date) : undefined}
                          onSelect={(selectedDate) => {
                            if (selectedDate) {
                              updateImportantDate(index, "date", selectedDate.toISOString().split('T')[0]);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
