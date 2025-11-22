import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_TITLE } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, MapPin, Settings as SettingsIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  
  const userQuery = trpc.auth.me.useQuery();
  const updateSettingsMutation = trpc.settings.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success("Settings updated successfully!");
      userQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to update settings: ${error.message}`);
    }
  });

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const currentUser = userQuery.data;

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
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-bold">Settings</h2>
            <p className="text-muted-foreground mt-2">
              Manage your preferences and account settings
            </p>
          </div>

          {userQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Name</Label>
                    <p className="text-base font-medium">{currentUser?.name || "Not set"}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    <p className="text-base font-medium">{currentUser?.email || "Not set"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Calling Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>Calling Preferences</CardTitle>
                  <CardDescription>Choose your default calling service</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="calling-service">Default Calling Service</Label>
                    <Select
                      value={currentUser?.preferredCallingService || "phone"}
                      onValueChange={(value) => {
                        updateSettingsMutation.mutate({
                          preferredCallingService: value as any
                        });
                      }}
                    >
                      <SelectTrigger id="calling-service">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">Phone Dialer</SelectItem>
                        <SelectItem value="google-voice">Google Voice</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="skype">Skype</SelectItem>
                        <SelectItem value="facetime">FaceTime</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      This service will be used by default when you click on phone numbers
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Distance Unit Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>Distance Unit</CardTitle>
                  <CardDescription>Choose how distances are displayed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="distance-unit">Preferred Distance Unit</Label>
                    <Select
                      value={currentUser?.distanceUnit || "km"}
                      onValueChange={(value) => {
                        updateSettingsMutation.mutate({
                          distanceUnit: value as "km" | "miles"
                        });
                      }}
                    >
                      <SelectTrigger id="distance-unit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="km">Kilometers (km)</SelectItem>
                        <SelectItem value="miles">Miles (mi)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      All route distances will be displayed in your preferred unit
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Google Integration */}
              <Card>
                <CardHeader>
                  <CardTitle>Google Integration</CardTitle>
                  <CardDescription>Manage your Google account connection</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Google Contacts</p>
                      <p className="text-sm text-muted-foreground">
                        Connected and syncing
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => navigate("/")}>
                      Sync Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
