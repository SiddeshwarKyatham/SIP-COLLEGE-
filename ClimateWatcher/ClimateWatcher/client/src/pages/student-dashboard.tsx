import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Task, Application } from "@shared/schema";
import Sidebar from "@/components/layout/sidebar";
import TaskCard from "@/components/tasks/task-card";
import DashboardStats from "@/components/ui/dashboard-stats";
import BadgeDisplay from "@/components/badges/badge-display";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ClipboardList, CheckCircle, Clock, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

const StudentDashboard = () => {
  const [_, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("available");
  const { user } = useAuth();
  
  // Fetch all tasks
  const { data: tasks, isLoading: isTasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch student applications
  const { data: applications, isLoading: isApplicationsLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications/student"],
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  });

  // Filter applied tasks
  const appliedTaskIds = applications?.map((app) => app.taskId) || [];
  const availableTasks = tasks?.filter((task) => 
    !appliedTaskIds.includes(task.id) && task.status === "open"
  ) || [];
  
  // Get applied tasks with status
  const myApplications = applications || [];
  
  // Calculate stats
  const pendingApplications = myApplications.filter(app => app.status === "applied").length;
  const acceptedApplications = myApplications.filter(app => app.status === "accepted").length;
  const rejectedApplications = myApplications.filter(app => app.status === "rejected").length;
  const totalApplied = myApplications.length;

  // Loading state
  if (isTasksLoading || isApplicationsLoading) {
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
        <h1 className="text-2xl font-bold mb-6">
          Welcome, {user?.fullName}!
        </h1>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <DashboardStats 
            title="Total Applied" 
            value={totalApplied.toString()} 
            icon={<ClipboardList className="h-5 w-5" />} 
            description="All tasks you've applied to" 
          />
          <DashboardStats 
            title="Pending" 
            value={pendingApplications.toString()} 
            icon={<Clock className="h-5 w-5" />} 
            description="Applications awaiting review" 
          />
          <DashboardStats 
            title="Accepted" 
            value={acceptedApplications.toString()} 
            icon={<CheckCircle className="h-5 w-5" />} 
            description="Applications accepted by employers" 
          />
          <DashboardStats 
            title="Messages" 
            value="0" 
            icon={<MessageSquare className="h-5 w-5" />} 
            description="Unread messages" 
          />
        </div>
        
        {/* Badges */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Badges</CardTitle>
            <CardDescription>Skills and achievements you've earned</CardDescription>
          </CardHeader>
          <CardContent>
            <BadgeDisplay />
          </CardContent>
        </Card>
        
        {/* Tasks Tabs */}
        <Tabs defaultValue="available" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="available">Available Tasks</TabsTrigger>
            <TabsTrigger value="applied">Applied Tasks</TabsTrigger>
            <TabsTrigger value="active">Active Tasks</TabsTrigger>
          </TabsList>
          
          {/* Available Tasks */}
          <TabsContent value="available">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableTasks.length > 0 ? (
                availableTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  />
                ))
              ) : (
                <div className="col-span-3 py-10 text-center">
                  <p className="text-gray-500">No available tasks found. Check back later!</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Applied Tasks */}
          <TabsContent value="applied">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myApplications.filter(app => app.status === "applied").length > 0 ? (
                myApplications
                  .filter(app => app.status === "applied")
                  .map((application) => {
                    const task = tasks?.find(t => t.id === application.taskId);
                    if (!task) return null;
                    return (
                      <TaskCard
                        key={application.id}
                        task={task}
                        applicationStatus={application.status}
                        onClick={() => navigate(`/tasks/${task.id}`)}
                      />
                    );
                  })
              ) : (
                <div className="col-span-3 py-10 text-center">
                  <p className="text-gray-500">You haven't applied to any tasks yet.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Active Tasks */}
          <TabsContent value="active">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myApplications.filter(app => app.status === "accepted").length > 0 ? (
                myApplications
                  .filter(app => app.status === "accepted")
                  .map((application) => {
                    const task = tasks?.find(t => t.id === application.taskId);
                    if (!task) return null;
                    return (
                      <TaskCard
                        key={application.id}
                        task={task}
                        applicationStatus={application.status}
                        onClick={() => navigate(`/tasks/${task.id}`)}
                      />
                    );
                  })
              ) : (
                <div className="col-span-3 py-10 text-center">
                  <p className="text-gray-500">You don't have any active tasks.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;
