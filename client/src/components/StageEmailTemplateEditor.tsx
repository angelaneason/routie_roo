import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmojiPickerButton } from "./EmojiPickerButton";

interface StageEmailTemplateEditorProps {
  stage: "30days" | "10days" | "5days" | "pastdue";
  stageLabel: string;
  stageDescription: string;
  subjectValue: string | null | undefined;
  contactBodyValue: string | null | undefined;
  teamBodyValue: string | null | undefined;
  onUpdate: (field: string, value: string | null) => void;
}

const defaultTemplates = {
  "30days": {
    subject: "🔔 Reminder: {dateType} coming up in 30 days",
    contactBody: "Hi {contactName} 👋\n\nThis is a friendly reminder from Routie Roo!\n\n📅 Important Date Approaching:\n- Type: {dateType}\n- Date: {date}\n- Days Until: 30 days\n\n⏰ Don't forget! Make sure to complete your {dateType} before the deadline.\n\nBest regards,\nThe Routie Roo Team 🦘",
    teamBody: "Hi Team,\n\nA 30-day reminder has been sent to {contactName} regarding their upcoming {dateType} on {date}.\n\nYou may want to follow up to ensure they're prepared."
  },
  "10days": {
    subject: "⚠️ Reminder: {dateType} coming up in 10 days",
    contactBody: "Hi {contactName} 👋\n\nThis is an important reminder from Routie Roo!\n\n📅 Important Date Approaching Soon:\n- Type: {dateType}\n- Date: {date}\n- Days Until: 10 days\n\n⚠️ Time is running out! Please make arrangements to complete your {dateType} as soon as possible.\n\nBest regards,\nThe Routie Roo Team 🦘",
    teamBody: "Hi Team,\n\nA 10-day reminder has been sent to {contactName} regarding their upcoming {dateType} on {date}.\n\nThis is getting close - you may want to follow up urgently."
  },
  "5days": {
    subject: "🚨 Urgent: {dateType} coming up in 5 days",
    contactBody: "Hi {contactName} 👋\n\nThis is an URGENT reminder from Routie Roo!\n\n📅 Important Date Very Close:\n- Type: {dateType}\n- Date: {date}\n- Days Until: 5 days\n\n🚨 URGENT! Your {dateType} is in just 5 days. Please take immediate action!\n\nBest regards,\nThe Routie Roo Team 🦘",
    teamBody: "Hi Team,\n\nA 5-day URGENT reminder has been sent to {contactName} regarding their upcoming {dateType} on {date}.\n\nThis is very urgent - immediate follow-up recommended."
  },
  "pastdue": {
    subject: "❗ OVERDUE: {dateType} is past due",
    contactBody: "Hi {contactName} 👋\n\nThis is an OVERDUE notice from Routie Roo!\n\n📅 Important Date Status:\n- Type: {dateType}\n- Date: {date}\n- Status: PAST DUE\n\n❗ Your {dateType} is now overdue. Please take action immediately!\n\nBest regards,\nThe Routie Roo Team 🦘",
    teamBody: "Hi Team,\n\nAn OVERDUE notice has been sent to {contactName} regarding their {dateType} which was due on {date}.\n\nThis is past due - urgent follow-up required."
  }
};

export function StageEmailTemplateEditor({
  stage,
  stageLabel,
  stageDescription,
  subjectValue,
  contactBodyValue,
  teamBodyValue,
  onUpdate
}: StageEmailTemplateEditorProps) {
  const defaults = defaultTemplates[stage];
  const subjectFieldId = `email-subject-${stage}`;
  const contactBodyFieldId = `email-body-contact-${stage}`;
  const teamBodyFieldId = `email-body-team-${stage}`;

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div>
        <h4 className="font-semibold">{stageLabel}</h4>
        <p className="text-sm text-muted-foreground">{stageDescription}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={subjectFieldId}>Email Subject</Label>
        <Input
          id={subjectFieldId}
          placeholder={defaults.subject}
          defaultValue={subjectValue || ""}
          onBlur={(e) => {
            if (e.target.value !== subjectValue) {
              onUpdate(`reminderEmail${stage === "30days" ? "30Days" : stage === "10days" ? "10Days" : stage === "5days" ? "5Days" : "PastDue"}Subject`, e.target.value || null);
            }
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={contactBodyFieldId}>Email Body (For Contact)</Label>
        <div className="relative">
          <Textarea
            id={contactBodyFieldId}
            placeholder={defaults.contactBody}
            rows={8}
            defaultValue={contactBodyValue || ""}
            onBlur={(e) => {
              if (e.target.value !== contactBodyValue) {
                onUpdate(`reminderEmail${stage === "30days" ? "30Days" : stage === "10days" ? "10Days" : stage === "5days" ? "5Days" : "PastDue"}BodyContact`, e.target.value || null);
              }
            }}
            className="font-mono text-sm pr-10"
          />
          <div className="absolute bottom-2 right-2">
            <EmojiPickerButton
              onEmojiSelect={(emoji) => {
                const textarea = document.getElementById(contactBodyFieldId) as HTMLTextAreaElement;
                if (textarea) {
                  const cursorPos = textarea.selectionStart;
                  const textBefore = textarea.value.substring(0, cursorPos);
                  const textAfter = textarea.value.substring(cursorPos);
                  textarea.value = textBefore + emoji + textAfter;
                  textarea.focus();
                  textarea.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
                  textarea.dispatchEvent(new Event('blur', { bubbles: true }));
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={teamBodyFieldId}>Email Body (For Scheduling Team)</Label>
        <div className="relative">
          <Textarea
            id={teamBodyFieldId}
            placeholder={defaults.teamBody}
            rows={6}
            defaultValue={teamBodyValue || ""}
            onBlur={(e) => {
              if (e.target.value !== teamBodyValue) {
                onUpdate(`reminderEmail${stage === "30days" ? "30Days" : stage === "10days" ? "10Days" : stage === "5days" ? "5Days" : "PastDue"}BodyTeam`, e.target.value || null);
              }
            }}
            className="font-mono text-sm pr-10"
          />
          <div className="absolute bottom-2 right-2">
            <EmojiPickerButton
              onEmojiSelect={(emoji) => {
                const textarea = document.getElementById(teamBodyFieldId) as HTMLTextAreaElement;
                if (textarea) {
                  const cursorPos = textarea.selectionStart;
                  const textBefore = textarea.value.substring(0, cursorPos);
                  const textAfter = textarea.value.substring(cursorPos);
                  textarea.value = textBefore + emoji + textAfter;
                  textarea.focus();
                  textarea.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
                  textarea.dispatchEvent(new Event('blur', { bubbles: true }));
                }
              }}
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Use template variables in curly braces: {'{contactName}'}, {'{dateType}'}, {'{date}'}, {'{daysUntil}'}. Leave blank to use default template.
      </p>
    </div>
  );
}
