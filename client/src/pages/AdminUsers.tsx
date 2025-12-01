import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, Users, Trash2, GitMerge, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function AdminUsers() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [targetUserId, setTargetUserId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const usersQuery = trpc.admin.listUsers.useQuery(undefined, { enabled: isAuthenticated && user?.role === 'admin' });

  const mergeUsersMutation = trpc.admin.mergeUsers.useMutation({
    onSuccess: () => {
      toast.success("Users merged successfully");
      utils.admin.listUsers.invalidate();
      setMergeDialogOpen(false);
      setSelectedUserId(null);
      setTargetUserId(null);
    },
    onError: (error) => {
      toast.error(`Failed to merge users: ${error.message}`);
    },
  });

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully");
      utils.admin.listUsers.invalidate();
      setDeleteDialogOpen(false);
      setSelectedUserId(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete user: ${error.message}`);
    },
  });

  if (!isAuthenticated || user?.role !== 'admin') {
    navigate("/");
    return null;
  }

  const users = usersQuery.data || [];

  const handleMergeClick = (userId: number) => {
    setSelectedUserId(userId);
    setMergeDialogOpen(true);
  };

  const handleDeleteClick = (userId: number) => {
    setSelectedUserId(userId);
    setDeleteDialogOpen(true);
  };

  const handleMergeConfirm = () => {
    if (selectedUserId && targetUserId && selectedUserId !== targetUserId) {
      mergeUsersMutation.mutate({
        sourceUserId: selectedUserId,
        targetUserId: targetUserId,
      });
    } else {
      toast.error("Please select two different users to merge");
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedUserId) {
      deleteUserMutation.mutate({ userId: selectedUserId });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600" />
                User Management
              </h1>
              <p className="text-sm text-gray-600">Manage user accounts and consolidate duplicates</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {usersQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid gap-4">
            {users.map((u: any) => (
              <Card key={u.id} className={u.id === user?.id ? "border-2 border-blue-500" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {u.name || "Unnamed User"}
                        {u.id === user?.id && (
                          <Badge variant="default" className="bg-blue-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Current User
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
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMergeClick(u.id)}
                            disabled={mergeUsersMutation.isPending}
                          >
                            <GitMerge className="h-4 w-4 mr-2" />
                            Merge
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(u.id)}
                            disabled={deleteUserMutation.isPending || u.routeCount > 0 || u.contactCount > 0}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-gray-600">Routes</div>
                      <div className="text-2xl font-bold text-blue-600">{u.routeCount}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-gray-600">Contacts</div>
                      <div className="text-2xl font-bold text-purple-600">{u.contactCount}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Merge Dialog */}
      <AlertDialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Merge User Accounts</AlertDialogTitle>
            <AlertDialogDescription>
              Select a target user to merge into. All routes, contacts, and data from the source user will be transferred to the target user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium mb-2">Merge into user:</label>
            <select
              className="w-full border border-gray-300 rounded-md p-2"
              value={targetUserId || ""}
              onChange={(e) => setTargetUserId(Number(e.target.value))}
            >
              <option value="">Select target user...</option>
              {users
                .filter((u: any) => u.id !== selectedUserId)
                .map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name || "Unnamed"} ({u.email}) - ID: {u.id}
                  </option>
                ))}
            </select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMergeConfirm} disabled={!targetUserId || mergeUsersMutation.isPending}>
              {mergeUsersMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Merging...
                </>
              ) : (
                "Merge Users"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user account? This action cannot be undone.
              Only users with no routes or contacts can be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteUserMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
