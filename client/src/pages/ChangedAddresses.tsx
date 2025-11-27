import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, Download, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function ChangedAddresses() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const changedAddressesQuery = trpc.contacts.getChangedAddresses.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const markSyncedMutation = trpc.contacts.markAddressSynced.useMutation({
    onSuccess: () => {
      toast.success("Address marked as synced");
      changedAddressesQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to mark as synced: ${error.message}`);
    },
  });
  
  const markAllSyncedMutation = trpc.contacts.markAllAddressesSynced.useMutation({
    onSuccess: () => {
      toast.success("All addresses marked as synced");
      changedAddressesQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to mark all as synced: ${error.message}`);
    },
  });

  useEffect(() => {
    document.title = `Changed Addresses - ${APP_TITLE}`;
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to view changed addresses</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const changedAddresses = changedAddressesQuery.data || [];

  const handleExportCSV = () => {
    if (changedAddresses.length === 0) {
      toast.error("No changed addresses to export");
      return;
    }

    // Create CSV content
    const headers = ["Contact Name", "Original Address", "Current Address", "Modified Date"];
    const rows = changedAddresses.map(contact => [
      contact.name || "",
      contact.originalAddress || "",
      contact.currentAddress || "",
      contact.modifiedAt ? new Date(contact.modifiedAt).toLocaleDateString() : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `changed-addresses-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV exported successfully");
  };

  const handleMarkSynced = (contactId: number) => {
    markSyncedMutation.mutate({ contactId });
  };

  const handleMarkAllSynced = () => {
    if (changedAddresses.length === 0) {
      toast.error("No changed addresses to mark as synced");
      return;
    }
    markAllSyncedMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Changed Addresses Report</h1>
              <p className="text-sm text-gray-600 italic">Track addresses modified in Routie Roo for Google Contacts sync</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{user?.name}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Address Changes</CardTitle>
                <CardDescription>
                  Contacts whose addresses have been modified in Routie Roo and need to be synced to Google Contacts
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={changedAddresses.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleMarkAllSynced}
                  disabled={changedAddresses.length === 0 || markAllSyncedMutation.isPending}
                >
                  {markAllSyncedMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Marking...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark All as Synced
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {changedAddressesQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : changedAddresses.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">All Synced!</h3>
                <p className="text-gray-600">
                  No address changes to sync. All contact addresses match Google Contacts.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {changedAddresses.map((contact) => (
                  <div
                    key={contact.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2">{contact.name}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 font-medium mb-1">Original Address (Google):</p>
                            <p className="text-gray-900">{contact.originalAddress || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 font-medium mb-1">Current Address (Routie Roo):</p>
                            <p className="text-gray-900">{contact.currentAddress || "N/A"}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Modified: {contact.modifiedAt ? new Date(contact.modifiedAt).toLocaleString() : "Unknown"}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkSynced(contact.id)}
                        disabled={markSyncedMutation.isPending}
                        className="ml-4"
                      >
                        {markSyncedMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Mark Synced
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How to Sync Changes to Google Contacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <p>
              <strong>1. Review the list above</strong> - These contacts have addresses that differ from Google Contacts
            </p>
            <p>
              <strong>2. Export to CSV</strong> - Click "Export CSV" to download the list for reference
            </p>
            <p>
              <strong>3. Update Google Contacts manually</strong> - Go to{" "}
              <a
                href="https://contacts.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google Contacts
              </a>{" "}
              and update each contact's address to match the "Current Address" shown above
            </p>
            <p>
              <strong>4. Mark as synced</strong> - After updating in Google Contacts, click "Mark Synced" to remove from this list
            </p>
            <p className="text-gray-600 italic">
              Note: Routie Roo uses one-way sync from Google Contacts. Address changes made here are not automatically
              synced back to Google.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
