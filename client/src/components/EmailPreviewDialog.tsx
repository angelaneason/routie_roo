import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface StageTemplates {
  subject: string | null | undefined;
  bodyContact: string | null | undefined;
  bodyTeam: string | null | undefined;
}

interface EmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates30Days: StageTemplates;
  templates10Days: StageTemplates;
  templates5Days: StageTemplates;
  templatesPastDue: StageTemplates;
}

export function EmailPreviewDialog({
  open,
  onOpenChange,
  templates30Days,
  templates10Days,
  templates5Days,
  templatesPastDue,
}: EmailPreviewDialogProps) {
  // Sample data for each stage
  const stages = [
    {
      id: "30days",
      label: "30 Days Before",
      sampleData: {
        contactName: "John Smith",
        dateType: "License Renewal",
        date: "March 15, 2025",
        daysUntil: "30",
      },
      templates: templates30Days,
      defaultSubject: "🔔 Reminder: {dateType} coming up in 30 days",
      defaultBodyContact: `Hi {contactName} 👋

This is a friendly reminder from Routie Roo!

📅 Important Date Approaching:
- Type: {dateType}
- Date: {date}
- Days Until: 30 days

⏰ Don't forget! Make sure to complete your {dateType} before the deadline.

Best regards,
The Routie Roo Team 🦘`,
      defaultBodyTeam: `Hi Team,

A 30-day reminder has been sent to {contactName} regarding their upcoming {dateType} on {date}.

You may want to follow up to ensure they're prepared.`,
    },
    {
      id: "10days",
      label: "10 Days Before",
      sampleData: {
        contactName: "Sarah Johnson",
        dateType: "Insurance Renewal",
        date: "February 20, 2025",
        daysUntil: "10",
      },
      templates: templates10Days,
      defaultSubject: "⚠️ Reminder: {dateType} coming up in 10 days",
      defaultBodyContact: `Hi {contactName} 👋

This is an important reminder from Routie Roo!

📅 Important Date Approaching Soon:
- Type: {dateType}
- Date: {date}
- Days Until: 10 days

⚠️ Time is running out! Please make arrangements to complete your {dateType} as soon as possible.

Best regards,
The Routie Roo Team 🦘`,
      defaultBodyTeam: `Hi Team,

A 10-day reminder has been sent to {contactName} regarding their upcoming {dateType} on {date}.

This is getting close - you may want to follow up urgently.`,
    },
    {
      id: "5days",
      label: "5 Days Before (Urgent)",
      sampleData: {
        contactName: "Michael Brown",
        dateType: "Certification Renewal",
        date: "January 30, 2025",
        daysUntil: "5",
      },
      templates: templates5Days,
      defaultSubject: "🚨 Urgent: {dateType} coming up in 5 days",
      defaultBodyContact: `Hi {contactName} 👋

This is an URGENT reminder from Routie Roo!

📅 Important Date Very Close:
- Type: {dateType}
- Date: {date}
- Days Until: 5 days

🚨 URGENT! Your {dateType} is in just 5 days. Please take immediate action!

Best regards,
The Routie Roo Team 🦘`,
      defaultBodyTeam: `Hi Team,

A 5-day URGENT reminder has been sent to {contactName} regarding their upcoming {dateType} on {date}.

This is very urgent - immediate follow-up recommended.`,
    },
    {
      id: "pastdue",
      label: "Past Due (Overdue)",
      sampleData: {
        contactName: "Emily Davis",
        dateType: "License Renewal",
        date: "December 15, 2024",
        daysUntil: "-5",
      },
      templates: templatesPastDue,
      defaultSubject: "❗ OVERDUE: {dateType} is past due",
      defaultBodyContact: `Hi {contactName} 👋

This is an OVERDUE notice from Routie Roo!

📅 Important Date Status:
- Type: {dateType}
- Date: {date}
- Status: PAST DUE

❗ Your {dateType} is now overdue. Please take action immediately!

Best regards,
The Routie Roo Team 🦘`,
      defaultBodyTeam: `Hi Team,

An OVERDUE notice has been sent to {contactName} regarding their {dateType} which was due on {date}.

This is past due - urgent follow-up required.`,
    },
  ];

  // Apply template substitution
  const substituteTemplate = (template: string, data: typeof stages[0]["sampleData"]) => {
    return template
      .replace(/{contactName}/g, data.contactName)
      .replace(/{dateType}/g, data.dateType)
      .replace(/{date}/g, data.date)
      .replace(/{daysUntil}/g, data.daysUntil);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email Template Preview - All Stages</DialogTitle>
          <DialogDescription>
            Preview how your reminder emails will look at each stage with sample data
          </DialogDescription>
        </DialogHeader>

        <Accordion type="single" collapsible className="w-full">
          {stages.map((stage) => {
            const previewSubject = substituteTemplate(
              stage.templates.subject || stage.defaultSubject,
              stage.sampleData
            );
            const previewBodyContact = substituteTemplate(
              stage.templates.bodyContact || stage.defaultBodyContact,
              stage.sampleData
            );
            const previewBodyTeam = substituteTemplate(
              stage.templates.bodyTeam || stage.defaultBodyTeam,
              stage.sampleData
            );

            return (
              <AccordionItem key={stage.id} value={stage.id}>
                <AccordionTrigger className="text-left">
                  <div>
                    <div className="font-semibold">{stage.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {stage.sampleData.contactName} - {stage.sampleData.dateType}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Tabs defaultValue="contact" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="contact">Contact Email</TabsTrigger>
                      <TabsTrigger value="team">Team Email</TabsTrigger>
                    </TabsList>

                    <TabsContent value="contact" className="space-y-4 mt-4">
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
                    </TabsContent>

                    <TabsContent value="team" className="space-y-4 mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium text-muted-foreground">Subject</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="font-semibold">
                            📋 Team Alert: {stage.sampleData.dateType} reminder sent to{" "}
                            {stage.sampleData.contactName}
                          </p>
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
                    </TabsContent>
                  </Tabs>

                  <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md mt-4">
                    <p className="font-semibold mb-1">Sample Data Used:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Contact Name: {stage.sampleData.contactName}</li>
                      <li>Date Type: {stage.sampleData.dateType}</li>
                      <li>Date: {stage.sampleData.date}</li>
                      <li>Days Until: {stage.sampleData.daysUntil}</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </DialogContent>
    </Dialog>
  );
}
