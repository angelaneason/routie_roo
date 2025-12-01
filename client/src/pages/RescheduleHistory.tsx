import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar, Clock, Loader2, MapPin, Download } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

type StatusFilter = "all" | "pending" | "completed" | "re_missed" | "cancelled";

export default function RescheduleHistory() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const utils = trpc.useUtils();

  const historyQuery = trpc.routes.getRescheduleHistory.useQuery(
    { status: statusFilter === "all" ? undefined : statusFilter },
    { enabled: isAuthenticated }
  );

  const updateStatusMutation = trpc.routes.updateRescheduleStatus.useMutation({
    onSuccess: () => {
      utils.routes.getRescheduleHistory.invalidate();
    },
  });

  const handleUpdateStatus = (historyId: number, status: "completed" | "re_missed") => {
    updateStatusMutation.mutate({ historyId, status });
  };

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const history = historyQuery.data || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: "default", label: "Pending" },
      completed: { variant: "default", label: "Completed" },
      re_missed: { variant: "destructive", label: "Re-Missed" },
      cancelled: { variant: "secondary", label: "Cancelled" },
    };
    
    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const exportToCSV = () => {
    if (history.length === 0) return;

    const headers = ["Contact", "Address", "Route", "Original Date", "Rescheduled Date", "Status", "Completed At", "Missed Reason", "Notes"];
    const rows = history.map(item => [
      item.contactName,
      item.address,
      item.routeName,
      item.originalDate ? new Date(item.originalDate).toLocaleString() : "N/A",
      new Date(item.rescheduledDate).toLocaleString(),
      item.status,
      item.completedAt ? new Date(item.completedAt).toLocaleString() : "N/A",
      item.missedReason || "N/A",
      item.notes || "N/A",
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reschedule-history-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white border-b">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <MapPin className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">{APP_TITLE}</h1>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Reschedule History</h2>
              <p className="text-muted-foreground mt-2 italic">
                Complete history of all rescheduled stops
              </p>
            </div>
            <Button onClick={exportToCSV} variant="outline" disabled={history.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Filter by status:</label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="re_missed">Re-Missed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* History List */}
          {historyQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : history.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No reschedule history</p>
                <p className="text-sm text-muted-foreground">
                  {statusFilter === "all" 
                    ? "No stops have been rescheduled yet"
                    : `No ${statusFilter} rescheduled stops`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  {statusFilter === "all" 
                    ? `All Reschedules (${history.length})`
                    : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} (${history.length})`
                  }
                </CardTitle>
                <CardDescription>
                  Showing {history.length} reschedule {history.length === 1 ? "event" : "events"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusBadge(item.status)}
                            <Link href={`/route/${item.routeId}`}>
                              <Button variant="link" className="h-auto p-0 text-sm">
                                {item.routeName}
                              </Button>
                            </Link>
                          </div>
                          <p className="font-medium text-lg">{item.contactName}</p>
                          <p className="text-sm text-muted-foreground">{item.address}</p>
                        </div>
                        {item.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(item.id, "completed")}
                            >
                              Mark Completed
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(item.id, "re_missed")}
                            >
                              Mark Re-Missed
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {item.originalDate && (
                          <div className="flex items-start gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium">Original Date:</p>
                              <p className="text-muted-foreground">
                                {new Date(item.originalDate).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start gap-2 text-sm">
                          <Clock className="h-4 w-4 text-purple-600 mt-0.5" />
                          <div>
                            <p className="font-medium">Rescheduled For:</p>
                            <p className="text-purple-700">
                              {new Date(item.rescheduledDate).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {item.completedAt && (
                          <div className="flex items-start gap-2 text-sm">
                            <Clock className="h-4 w-4 text-green-600 mt-0.5" />
                            <div>
                              <p className="font-medium">Completed At:</p>
                              <p className="text-green-700">
                                {new Date(item.completedAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Rescheduled On:</p>
                            <p className="text-muted-foreground">
                              {new Date(item.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {item.missedReason && (
                        <div className="mt-4 text-sm bg-red-50 p-3 rounded">
                          <p className="font-medium text-red-900">Missed Reason:</p>
                          <p className="text-red-700">{item.missedReason}</p>
                        </div>
                      )}

                      {item.notes && (
                        <div className="mt-4 text-sm bg-blue-50 p-3 rounded">
                          <p className="font-medium text-blue-900">Notes:</p>
                          <p className="text-blue-700">{item.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
