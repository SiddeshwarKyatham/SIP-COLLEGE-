import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Task, Application } from "@shared/schema";
import Sidebar from "@/components/layout/sidebar";
import TaskCard from "@/components/tasks/task-card";
import DashboardStats from "@/components/ui/dashboard-stats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Briefcase, CheckCircle, Clock, Users, Plus,
  BarChart3, BarChart 
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import TaskForm from "@/components/tasks/task-form";
import EmployerMessages from "@/components/messages/employer-messages";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const EmployerDashboard = () => {
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("open");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const { user } = useAuth();

  // Determine which content to display based on the current route
  const isMessagesRoute = location.includes("/employer/messages");
  const isApplicantsRoute = location.includes("/employer/applicants");
  const isTasksRoute = location.includes("/employer/tasks");
  
  // Fetch employer tasks
  const { data: tasks, isLoading: isTasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    refetchInterval: 60000, // Refetch every minute
  });

  // Filter tasks by employer and status
  const myTasks = tasks?.filter(task => task.employerId === user?.id) || [];
  const openTasks = myTasks.filter(task => task.status === "open");
  const inProgressTasks = myTasks.filter(task => task.status === "in-progress");
  const completedTasks = myTasks.filter(task => task.status === "completed");
  
  // Get all applications for my tasks to calculate stats
  const taskIds = myTasks.map(task => task.id);

  // Count applications
  const { data: applications } = useQuery<Application[]>({
    queryKey: ["/api/applications/task", taskIds[0]],
    enabled: taskIds.length > 0,
    refetchInterval: 60000, // Refetch every minute
  });

  // Calculate stats
  const totalApplications = applications?.length || 0;
  const pendingApplications = applications?.filter(app => app.status === "applied").length || 0;

  // Loading state
  if (isTasksLoading) {
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
        {/* Show messages page if on messages route */}
        {isMessagesRoute ? (
          <EmployerMessages />
        ) : isApplicantsRoute ? (
          /* Applicants Page */
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Applicants</h1>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>All Applicants</CardTitle>
                <CardDescription>Review and manage applications to your tasks</CardDescription>
              </CardHeader>
              <CardContent>
                {applications && applications.length > 0 ? (
                  <div className="space-y-4">
                    {applications.map(app => (
                      <div 
                        key={app.id} 
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/tasks/${app.taskId}`)}
                      >
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium">Application #{app.id}</h3>
                            <p className="text-sm text-gray-500">
                              Student #{app.studentId} • Applied {format(new Date(app.appliedAt), "MMM d, yyyy")}
                            </p>
                          </div>
                          <Badge variant={
                            app.status === 'accepted' ? 'default' : 
                            app.status === 'rejected' ? 'destructive' : 
                            'secondary'
                          }>
                            {app.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p>No applications received yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : isTasksRoute ? (
          /* Tasks Page */
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">My Tasks</h1>
              
              <Button onClick={() => setIsTaskDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Post New Task
              </Button>
            </div>
            
            {/* Tasks List */}
            <Tabs defaultValue="open" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="open">Open Tasks</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              
              {/* Open Tasks */}
              <TabsContent value="open">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {openTasks.length > 0 ? (
                    openTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        showApplicants={true}
                        applicantCount={
                          applications?.filter(app => app.taskId === task.id && app.status === "applied").length || 0
                        }
                        onClick={() => navigate(`/tasks/${task.id}`)}
                      />
                    ))
                  ) : (
                    <div className="col-span-3 py-10 text-center">
                      <p className="text-gray-500">No open tasks. Click "Post New Task" to create one!</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* In Progress Tasks */}
              <TabsContent value="in-progress">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inProgressTasks.length > 0 ? (
                    inProgressTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => navigate(`/tasks/${task.id}`)}
                      />
                    ))
                  ) : (
                    <div className="col-span-3 py-10 text-center">
                      <p className="text-gray-500">No tasks in progress.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Completed Tasks */}
              <TabsContent value="completed">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedTasks.length > 0 ? (
                    completedTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => navigate(`/tasks/${task.id}`)}
                      />
                    ))
                  ) : (
                    <div className="col-span-3 py-10 text-center">
                      <p className="text-gray-500">No completed tasks yet.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          /* Default Dashboard */
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Welcome, {user?.fullName}!</h1>
              
              <Button onClick={() => setIsTaskDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Post New Task
              </Button>
            </div>
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <DashboardStats 
                title="Total Tasks" 
                value={myTasks.length.toString()} 
                icon={<Briefcase className="h-5 w-5" />} 
                description="All tasks you've posted" 
              />
              <DashboardStats 
                title="Active" 
                value={inProgressTasks.length.toString()} 
                icon={<Clock className="h-5 w-5" />} 
                description="Tasks currently in progress" 
              />
              <DashboardStats 
                title="Completed" 
                value={completedTasks.length.toString()} 
                icon={<CheckCircle className="h-5 w-5" />} 
                description="Successfully completed tasks" 
              />
              <DashboardStats 
                title="Applicants" 
                value={pendingApplications.toString()} 
                icon={<Users className="h-5 w-5" />} 
                description="New applicants to review" 
              />
            </div>
            
            {/* Hiring Activity Chart */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Hiring Activity</CardTitle>
                <CardDescription>Overview of your task postings and hires</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                {myTasks.length > 0 ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <BarChart3 className="h-24 w-24 text-gray-300" />
                    <p className="text-gray-500 ml-4">Activity charts will be available once you have more hiring data</p>
                  </div>
                ) : (
                  <p className="text-gray-500">Post tasks to see your hiring activity</p>
                )}
              </CardContent>
            </Card>
            
            {/* Recent Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
                <CardDescription>Your most recently posted tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myTasks.slice(0, 3).map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      showApplicants={true}
                      applicantCount={
                        applications?.filter(app => app.taskId === task.id && app.status === "applied").length || 0
                      }
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    />
                  ))}
                  {myTasks.length === 0 && (
                    <div className="col-span-3 py-10 text-center">
                      <p className="text-gray-500">No tasks posted yet. Click "Post New Task" to create one!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
          
        {/* Create Task Dialog */}
        <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Post a New Task</DialogTitle>
              <DialogDescription>
                Describe the task you need help with, set a budget, and required skills.
              </DialogDescription>
            </DialogHeader>
            <TaskForm 
              onSuccess={() => {
                setIsTaskDialogOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EmployerDashboard;
