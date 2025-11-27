import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailSubject?: string | null;
  emailBodyContact?: string | null;
  emailBodyTeam?: string | null;
}

export function EmailPreviewDialog({
  open,
  onOpenChange,
  emailSubject,
  emailBodyContact,
  emailBodyTeam,
}: EmailPreviewDialogProps) {
  // Sample data for preview
  const sampleData = {
    contactName: "John Smith",
    dateType: "License Renewal",
    date: "March 15, 2025",
    daysUntil: "30",
  };

  // Default templates
  const defaultSubject = "🔔 Reminder: {dateType} coming up in {daysUntil} days";
  const defaultBodyContact = `Hi {contactName} 👋

This is a friendly reminder from Routie Roo!

📅 Important Date Approaching:
- Type: {dateType}
- Date: {date}
- Days Until: {daysUntil} days

⏰ Don't forget! Make sure to complete your {dateType} before the deadline.

If you have any questions or need assistance, feel free to reach out to our scheduling team.

Best regards,
The Routie Roo Team 🦘`;

  const defaultBodyTeam = `Hi Team,

A reminder has been sent to {contactName} regarding their upcoming {dateType} on {date} ({daysUntil} days away).

**Contact Details:**
- Name: {contactName}
- Date Type: {dateType}
- Date: {date}

You may want to follow up to ensure they're prepared.`;

  // Apply template substitution
  const substituteTemplate = (template: string) => {
    return template
      .replace(/{contactName}/g, sampleData.contactName)
      .replace(/{dateType}/g, sampleData.dateType)
      .replace(/{date}/g, sampleData.date)
      .replace(/{daysUntil}/g, sampleData.daysUntil);
  };

  const previewSubject = substituteTemplate(emailSubject || defaultSubject);
  const previewBodyContact = substituteTemplate(emailBodyContact || defaultBodyContact);
  const previewBodyTeam = substituteTemplate(emailBodyTeam || defaultBodyTeam);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email Template Preview</DialogTitle>
          <DialogDescription>
            Preview how your reminder emails will look with sample data
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="contact" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contact">Contact Email</TabsTrigger>
            <TabsTrigger value="team">Team Email</TabsTrigger>
          </TabsList>

          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Subject</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{previewSubject}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Body</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {previewBodyContact}
                </div>
              </CardContent>
            </Card>

            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <p className="font-semibold mb-1">Sample Data Used:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Contact Name: {sampleData.contactName}</li>
                <li>Date Type: {sampleData.dateType}</li>
                <li>Date: {sampleData.date}</li>
                <li>Days Until: {sampleData.daysUntil}</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Subject</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">📋 Team Alert: {sampleData.dateType} reminder sent to {sampleData.contactName}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Body</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {previewBodyTeam}
                </div>
              </CardContent>
            </Card>

            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <p className="font-semibold mb-1">Sample Data Used:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Contact Name: {sampleData.contactName}</li>
                <li>Date Type: {sampleData.dateType}</li>
                <li>Date: {sampleData.date}</li>
                <li>Days Until: {sampleData.daysUntil}</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
