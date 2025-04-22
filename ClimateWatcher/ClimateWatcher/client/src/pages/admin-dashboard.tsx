import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Task, Report } from "@shared/schema";
import Sidebar from "@/components/layout/sidebar";
import DashboardStats from "@/components/ui/dashboard-stats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, UserCog, Flag, CheckCircle, AlertTriangle, Users, 
  Briefcase, ShieldAlert, Ban
} from "lucide-react";
import { useLocation } from "wouter";
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";

const AdminDashboard = () => {
  const [_, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("users");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch all users
  const { data: users, isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch all tasks
  const { data: tasks, isLoading: isTasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch all reports
  const { data: reports, isLoading: isReportsLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
    refetchInterval: 60000, // Refetch every minute
  });

  // Mutation to handle report status update
  const updateReportStatusMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/reports/${reportId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      setIsReportDialogOpen(false);
      setSelectedReport(null);
      
      toast({
        title: "Report updated",
        description: "The report status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate stats
  const studentCount = users?.filter(user => user.role === "student").length || 0;
  const employerCount = users?.filter(user => user.role === "employer").length || 0;
  const adminCount = users?.filter(user => user.role === "admin").length || 0;
  
  const pendingReports = reports?.filter(report => report.status === "pending").length || 0;
  const resolvedReports = reports?.filter(report => report.status === "resolved").length || 0;
  const rejectedReports = reports?.filter(report => report.status === "rejected").length || 0;

  // Handle report status update
  const handleReportStatusUpdate = (status: string) => {
    if (selectedReport) {
      updateReportStatusMutation.mutate({ 
        reportId: selectedReport.id, 
        status 
      });
    }
  };

  // Loading state
  if (isUsersLoading || isTasksLoading || isReportsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <DashboardStats 
            title="Total Users" 
            value={(users?.length || 0).toString()} 
            icon={<Users className="h-5 w-5" />} 
            description={`${studentCount} students, ${employerCount} employers, ${adminCount} admins`} 
          />
          <DashboardStats 
            title="Total Tasks" 
            value={(tasks?.length || 0).toString()} 
            icon={<Briefcase className="h-5 w-5" />} 
            description={`${tasks?.filter(task => task.status === "open").length || 0} open, ${tasks?.filter(task => task.status === "in-progress").length || 0} in progress, ${tasks?.filter(task => task.status === "completed").length || 0} completed`} 
          />
          <DashboardStats 
            title="Reports" 
            value={(reports?.length || 0).toString()} 
            icon={<Flag className="h-5 w-5" />} 
            description={`${pendingReports} pending, ${resolvedReports} resolved, ${rejectedReports} rejected`} 
          />
        </div>
        
        {/* Admin Tabs */}
        <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="badges">Badge Management</TabsTrigger>
          </TabsList>
          
          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all users on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-6 bg-slate-50 p-4 text-sm font-medium">
                    <div>ID</div>
                    <div>Name</div>
                    <div>Username</div>
                    <div>Email</div>
                    <div>Role</div>
                    <div>Actions</div>
                  </div>
                  <Separator />
                  {users?.map((user) => (
                    <div key={user.id} className="grid grid-cols-6 p-4 text-sm items-center">
                      <div>{user.id}</div>
                      <div>{user.fullName}</div>
                      <div>{user.username}</div>
                      <div>{user.email}</div>
                      <div>
                        <Badge 
                          variant={user.role === "admin" ? "destructive" : user.role === "employer" ? "outline" : "secondary"}
                          className="capitalize"
                        >
                          {user.role}
                        </Badge>
                      </div>
                      <div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/profile?userId=${user.id}`)}
                        >
                          <UserCog className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Reports Management</CardTitle>
                <CardDescription>Handle reported users and tasks</CardDescription>
              </CardHeader>
              <CardContent>
                {reports && reports.length > 0 ? (
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 bg-slate-50 p-4 text-sm font-medium">
                      <div>ID</div>
                      <div>Reported By</div>
                      <div>Reason</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                    <Separator />
                    {reports.map((report) => {
                      const reporter = users?.find(u => u.id === report.reporterId);
                      
                      return (
                        <div key={report.id} className="grid grid-cols-5 p-4 text-sm items-center">
                          <div>{report.id}</div>
                          <div>{reporter?.fullName || "Unknown"}</div>
                          <div className="truncate max-w-xs">{report.reason}</div>
                          <div>
                            <Badge 
                              variant={
                                report.status === "pending" ? "outline" : 
                                report.status === "resolved" ? "default" : 
                                "secondary"
                              }
                              className="capitalize"
                            >
                              {report.status}
                            </Badge>
                          </div>
                          <div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedReport(report);
                                setIsReportDialogOpen(true);
                              }}
                            >
                              <Flag className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <ShieldAlert className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No reports have been submitted yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Badges Tab */}
          <TabsContent value="badges">
            <Card>
              <CardHeader>
                <CardTitle>Badge Management</CardTitle>
                <CardDescription>Create and assign badges to users</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-500 py-8">
                  Badge management feature is coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Report Review Dialog */}
        {selectedReport && (
          <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Review Report</DialogTitle>
                <DialogDescription>
                  Review the report details and take appropriate action
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <h3 className="text-sm font-medium">Report ID</h3>
                  <p className="mt-1 text-sm text-gray-500">{selectedReport.id}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium">Reporter</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {users?.find(u => u.id === selectedReport.reporterId)?.fullName || "Unknown"}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium">Reported Item</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedReport.reportedUserId 
                      ? `User: ${users?.find(u => u.id === selectedReport.reportedUserId)?.fullName || "Unknown"}`
                      : `Task: ${tasks?.find(t => t.id === selectedReport.reportedTaskId)?.title || "Unknown"}`
                    }
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium">Reason</h3>
                  <p className="mt-1 text-sm text-gray-500 whitespace-pre-line">{selectedReport.reason}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium">Status</h3>
                  <Badge 
                    variant={
                      selectedReport.status === "pending" ? "outline" : 
                      selectedReport.status === "resolved" ? "default" : 
                      "secondary"
                    }
                    className="mt-1 capitalize"
                  >
                    {selectedReport.status}
                  </Badge>
                </div>
              </div>
              
              <DialogFooter className="flex space-x-2">
                <Button 
                  variant="destructive"
                  onClick={() => {
                    if (selectedReport.reportedUserId) {
                      toast({
                        title: "User Ban",
                        description: "User ban functionality will be implemented soon.",
                      });
                    } else {
                      toast({
                        title: "Task Removal",
                        description: "Task removal functionality will be implemented soon.",
                      });
                    }
                  }}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  {selectedReport.reportedUserId ? "Ban User" : "Remove Task"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleReportStatusUpdate("rejected")}
                  disabled={updateReportStatusMutation.isPending}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Reject Report
                </Button>
                <Button 
                  onClick={() => handleReportStatusUpdate("resolved")}
                  disabled={updateReportStatusMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Resolve
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
