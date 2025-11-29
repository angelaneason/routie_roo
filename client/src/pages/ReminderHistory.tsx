import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE, APP_LOGO } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, Mail, CheckCircle2, XCircle, Calendar, User, Clock } from "lucide-react";
import { Link } from "wouter";

export default function ReminderHistory() {
  const historyQuery = trpc.settings.getReminderHistory.useQuery({ limit: 100 });

  const formatDate = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getReminderTypeLabel = (type: string) => {
    if (type === "past_due") return "Past Due";
    if (type.endsWith("_days")) {
      const days = type.replace("_days", "");
      return `${days} Days Before`;
    }
    return type;
  };

  const parseSentTo = (sentToJson: string) => {
    try {
      const emails = JSON.parse(sentToJson);
      return Array.isArray(emails) ? emails : [];
    } catch {
      return [];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{APP_TITLE}</h1>
                  <p className="text-sm text-muted-foreground">Reminder History</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Sent Reminders
                </CardTitle>
                <CardDescription>
                  History of email reminders sent for important dates
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {historyQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : historyQuery.data && historyQuery.data.length > 0 ? (
              <div className="space-y-3">
                {historyQuery.data.map((reminder) => (
                  <Card key={reminder.id} className="border-l-4" style={{
                    borderLeftColor: reminder.status === "success" ? "#10b981" : "#ef4444"
                  }}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{reminder.contactName}</span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{reminder.dateType}</span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Date: {reminder.importantDate}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Sent: {formatDate(reminder.sentAt)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                              {getReminderTypeLabel(reminder.reminderType)}
                            </span>
                            {reminder.status === "success" ? (
                              <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Sent Successfully
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 flex items-center gap-1">
                                <XCircle className="h-3 w-3" />
                                Failed
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            Sent to: {parseSentTo(reminder.sentTo).join(", ")}
                          </div>

                          {reminder.errorMessage && (
                            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                              Error: {reminder.errorMessage}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reminders sent yet</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  When email reminders are sent for important dates, they will appear here. 
                  Make sure to enable reminders in Settings and configure your scheduling email.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
