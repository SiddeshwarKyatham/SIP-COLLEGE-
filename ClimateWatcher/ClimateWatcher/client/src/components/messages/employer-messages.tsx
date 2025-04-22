import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Application, Task, Message } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, MessageCircle, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import ChatInterface from "../chat/chat-interface-improved";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

export function EmployerMessages() {
  const { user } = useAuth();
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Fetch tasks created by this employer
  const { data: tasks, isLoading: isTasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Filter tasks by this employer
  const myTasks = tasks?.filter(task => task.employerId === user?.id) || [];
  
  // Fetch applications for the selected task
  const { data: applications, isLoading: isApplicationsLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications/task", selectedTask?.id || 0],
    enabled: !!selectedTask,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Set first task as selected on initial load
  useEffect(() => {
    if (myTasks.length > 0 && !selectedTask) {
      setSelectedTask(myTasks[0]);
    }
  }, [myTasks, selectedTask]);
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  if (isTasksLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (myTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <MessageCircle className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-700">No Tasks Available</h3>
        <p className="text-gray-500 mt-1">
          Create tasks to receive applications and messages from students
        </p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col mb-10">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Task List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="all" className="w-full">
                <div className="px-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="in-progress">Active</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="all" className="mt-0">
                  <ScrollArea className="h-[300px]">
                    <div className="divide-y">
                      {myTasks.map(task => (
                        <button
                          key={task.id}
                          className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                            selectedTask?.id === task.id ? 'bg-gray-50' : ''
                          }`}
                          onClick={() => {
                            setSelectedTask(task);
                            setSelectedApplication(null);
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="truncate flex-1">
                              <p className="font-medium text-sm truncate">{task.title}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Due: {format(new Date(task.deadline), "MMM d, yyyy")}
                              </p>
                            </div>
                            <Badge variant={task.status === 'completed' ? 'secondary' : 'default'} className="ml-2">
                              {task.status}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="in-progress" className="mt-0">
                  <ScrollArea className="h-[300px]">
                    <div className="divide-y">
                      {myTasks.filter(t => t.status === 'in-progress').map(task => (
                        <button
                          key={task.id}
                          className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                            selectedTask?.id === task.id ? 'bg-gray-50' : ''
                          }`}
                          onClick={() => {
                            setSelectedTask(task);
                            setSelectedApplication(null);
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="truncate flex-1">
                              <p className="font-medium text-sm truncate">{task.title}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Due: {format(new Date(task.deadline), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="completed" className="mt-0">
                  <ScrollArea className="h-[300px]">
                    <div className="divide-y">
                      {myTasks.filter(t => t.status === 'completed').map(task => (
                        <button
                          key={task.id}
                          className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                            selectedTask?.id === task.id ? 'bg-gray-50' : ''
                          }`}
                          onClick={() => {
                            setSelectedTask(task);
                            setSelectedApplication(null);
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="truncate flex-1">
                              <p className="font-medium text-sm truncate">{task.title}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Due: {format(new Date(task.deadline), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Applicants and Chat Area */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Applicants List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {selectedTask ? `Applicants for "${selectedTask.title}"` : 'Select a task'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isApplicationsLoading ? (
                <div className="flex justify-center items-center h-24">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : !selectedTask ? (
                <div className="text-center py-6 text-gray-500">
                  Select a task to view applications
                </div>
              ) : applications && applications.length > 0 ? (
                <ScrollArea className="h-[200px]">
                  <div className="divide-y">
                    {applications.map(application => (
                      <button
                        key={application.id}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                          selectedApplication?.id === application.id ? 'bg-gray-50' : ''
                        }`}
                        onClick={() => setSelectedApplication(application)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {application.studentId.toString().substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-grow min-w-0">
                            <p className="font-medium text-sm">Applicant #{application.studentId}</p>
                            <p className="text-xs text-gray-500">
                              Applied: {format(new Date(application.appliedAt), "MMM d, yyyy")}
                            </p>
                          </div>
                          <Badge variant={
                            application.status === 'accepted' ? 'default' : 
                            application.status === 'rejected' ? 'destructive' : 
                            'secondary'
                          }>
                            {application.status}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No applications yet for this task
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Chat Interface */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {selectedApplication 
                  ? `Conversation with Applicant #${selectedApplication.studentId}` 
                  : 'Select an applicant to chat'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {selectedApplication ? (
                <ChatInterface 
                  applicationId={selectedApplication.id} 
                  receiverId={selectedApplication.studentId} 
                />
              ) : (
                <div className="h-[400px] flex items-center justify-center bg-gray-50 text-gray-500">
                  <div className="text-center">
                    <User className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                    <p>Select an applicant to view conversation</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default EmployerMessages;