import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, 
  Loader2, 
  Users, 
  Activity, 
  BarChart3, 
  Shield, 
  Eye,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useImpersonation } from "@/contexts/ImpersonationContext";

export default function AdminUsers() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Queries
  const usersQuery = trpc.admin.getAllUsers.useQuery(undefined, { 
    enabled: isAuthenticated && user?.role === 'admin' 
  });
  
  const systemStatsQuery = trpc.admin.getSystemStats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin'
  });
  
  const loginAttemptsQuery = trpc.admin.getLoginAttempts.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isAuthenticated && user?.role === 'admin' }
  );
  
  const failedLoginsQuery = trpc.admin.getLoginAttempts.useQuery(
    { limit: 50, offset: 0, failedOnly: true },
    { enabled: isAuthenticated && user?.role === 'admin' }
  );
  
  const userActivityQuery = trpc.admin.getUserActivity.useQuery(
    { userId: selectedUserId! },
    { enabled: !!selectedUserId && user?.role === 'admin' }
  );

  // Redirect if not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    navigate("/workspace");
    return null;
  }

  const users = usersQuery.data || [];
  const systemStats = systemStatsQuery.data;
  const loginAttempts = loginAttemptsQuery.data || [];
  const failedLogins = failedLoginsQuery.data || [];
  
  // Filter users by search query
  const filteredUsers = users.filter((u: any) => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { startImpersonation } = useImpersonation();
  const startImpersonationMutation = trpc.admin.startImpersonation.useMutation({
    onSuccess: (data) => {
      startImpersonation(data.targetUser, data.adminUserId);
    },
    onError: (error) => {
      toast.error(`Failed to start impersonation: ${error.message}`);
    },
  });

  const handleViewAs = (userId: number, userName: string | null) => {
    if (confirm(`Start viewing as ${userName || 'this user'}? You will see their data and can work with their routes.`)) {
      startImpersonationMutation.mutate({ targetUserId: userId });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/workspace">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                Admin Panel
              </h1>
              <p className="text-sm text-gray-600">System monitoring and user management</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="logins">
              <Activity className="h-4 w-4 mr-2" />
              Login Activity
            </TabsTrigger>
            <TabsTrigger value="failed">
              <AlertCircle className="h-4 w-4 mr-2" />
              Failed Logins
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {systemStats?.totalUsers || 0}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {systemStats?.activeUsers || 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Routes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {systemStats?.totalRoutes || 0}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Contacts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {systemStats?.totalContacts || 0}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Completed Stops</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-teal-600">
                    {systemStats?.totalCompletedStops || 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {usersQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredUsers.map((u: any) => (
                  <Card key={u.id} className={u.id === user?.id ? "border-2 border-blue-500" : ""}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            {u.name || "Unnamed User"}
                            {u.id === user?.id && (
                              <Badge variant="default" className="bg-blue-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                You
                              </Badge>
                            )}
                            {u.role === 'admin' && (
                              <Badge variant="secondary">Admin</Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            <div className="space-y-1">
                              <div><strong>Email:</strong> {u.email || "No email"}</div>
                              <div><strong>User ID:</strong> {u.id}</div>
                              <div><strong>Login Method:</strong> {u.loginMethod || "Unknown"}</div>
                              <div><strong>Last Sign In:</strong> {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleString() : "Never"}</div>
                            </div>
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {u.id !== user?.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewAs(u.id, u.name)}
                              disabled={startImpersonationMutation.isPending}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View As
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUserId(u.id === selectedUserId ? null : u.id)}
                          >
                            {selectedUserId === u.id ? "Hide Details" : "Show Details"}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {selectedUserId === u.id && userActivityQuery.data && (
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="text-gray-600">Routes</div>
                            <div className="text-2xl font-bold text-blue-600">
                              {userActivityQuery.data.routeCount}
                            </div>
                          </div>
                          <div className="bg-purple-50 p-3 rounded-lg">
                            <div className="text-gray-600">Contacts</div>
                            <div className="text-2xl font-bold text-purple-600">
                              {userActivityQuery.data.contactCount}
                            </div>
                          </div>
                          <div className="bg-teal-50 p-3 rounded-lg">
                            <div className="text-gray-600">Completed Stops</div>
                            <div className="text-2xl font-bold text-teal-600">
                              {userActivityQuery.data.completedStops}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Login Activity Tab */}
          <TabsContent value="logins" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Login Attempts</CardTitle>
                <CardDescription>All login attempts (successful and failed)</CardDescription>
              </CardHeader>
              <CardContent>
                {loginAttemptsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {loginAttempts.map((attempt: any) => (
                      <div 
                        key={attempt.id} 
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          {attempt.success ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <div>
                            <div className="font-medium">
                              {attempt.email || "Unknown"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(attempt.attemptedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-gray-600">{attempt.loginMethod}</div>
                          {!attempt.success && attempt.failureReason && (
                            <div className="text-red-600 text-xs">{attempt.failureReason}</div>
                          )}
                          {attempt.ipAddress && (
                            <div className="text-gray-400 text-xs">{attempt.ipAddress}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Failed Logins Tab */}
          <TabsContent value="failed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Failed Login Attempts</CardTitle>
                <CardDescription>Security monitoring for failed authentication attempts</CardDescription>
              </CardHeader>
              <CardContent>
                {failedLoginsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : failedLogins.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-600" />
                    <p>No failed login attempts</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {failedLogins.map((attempt: any) => (
                      <div 
                        key={attempt.id} 
                        className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50"
                      >
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <div>
                            <div className="font-medium text-red-900">
                              {attempt.email || "Unknown"}
                            </div>
                            <div className="text-sm text-red-700">
                              {new Date(attempt.attemptedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-red-900">{attempt.loginMethod}</div>
                          {attempt.failureReason && (
                            <div className="text-red-700 text-xs font-medium">{attempt.failureReason}</div>
                          )}
                          {attempt.ipAddress && (
                            <div className="text-red-600 text-xs">{attempt.ipAddress}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
