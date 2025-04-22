import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Task, Application, User, InsertApplication, InsertPayment } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useParams, useLocation } from "wouter";
import ChatInterface from "@/components/chat/chat-interface";
import { PaymentModal } from "@/components/payments/payment-modal";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, Calendar, DollarSign, Clock, User as UserIcon, 
  CheckCircle, XCircle, MessageSquare, AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Application form schema
const applicationSchema = z.object({
  coverLetter: z.string().min(30, "Cover letter must be at least 30 characters"),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

const TaskDetail = () => {
  const { id } = useParams<{ id: string }>();
  const taskId = parseInt(id);
  const { toast } = useToast();
  
  // Handle auth safely
  let user = null;
  try {
    // Only use auth if we're in an AuthProvider
    const auth = useAuth();
    user = auth.user;
  } catch (error) {
    // Handle not being in an AuthProvider
    console.log("Auth provider not available, continuing as guest");
  }
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [_, navigate] = useLocation();
  const goBack = () => {
    window.history.back();
  };

  // Fetch task details
  const { data: task, isLoading: isTaskLoading } = useQuery<Task>({
    queryKey: [`/api/tasks/${taskId}`],
    enabled: !isNaN(taskId),
  });

  // Fetch applications for this task (if employer or admin)
  const { data: applications, isLoading: isApplicationsLoading } = useQuery<Application[]>({
    queryKey: [`/api/applications/task/${taskId}`],
    enabled: !isNaN(taskId) && (user?.role === "employer" || user?.role === "admin"),
  });

  // Fetch all users for mapping student names (if employer or admin)
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: user?.role === "employer" || user?.role === "admin",
  });
  
  // Fetch similar tasks
  const { data: tasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    enabled: !isNaN(taskId),
  });

  // Fetch student applications (if student)
  const { data: studentApplications, isLoading: isStudentApplicationsLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications/student"],
    enabled: !isNaN(taskId) && user?.role === "student",
  });

  // Application form
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      coverLetter: "",
    },
  });

  // Check if student has already applied
  const hasApplied = studentApplications?.some(app => app.taskId === taskId);

  // Find the student's application for this task
  const studentApplication = studentApplications?.find(app => app.taskId === taskId);

  // Mutations
  const applyMutation = useMutation({
    mutationFn: async (data: InsertApplication) => {
      const res = await apiRequest("POST", "/api/applications", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications/student"] });
      setIsApplyDialogOpen(false);
      form.reset();
      
      toast({
        title: "Application submitted",
        description: "Your application has been successfully submitted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Application failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/applications/${applicationId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/applications/task/${taskId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
      
      toast({
        title: "Application updated",
        description: "The application status has been updated.",
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

  const markAsPaidMutation = useMutation({
    mutationFn: async (data: InsertPayment) => {
      const res = await apiRequest("POST", "/api/payments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/applications/task/${taskId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
      
      toast({
        title: "Task marked as paid",
        description: "The payment has been recorded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reportTaskMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await apiRequest("POST", "/api/reports", {
        reportedTaskId: taskId,
        reason,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Task reported",
        description: "Your report has been submitted and will be reviewed by an admin.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Report failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle apply submission
  const onApplySubmit = (data: ApplicationFormValues) => {
    if (!user) return;
    
    applyMutation.mutate({
      taskId,
      studentId: user.id,
      coverLetter: data.coverLetter,
      status: "applied",
    });
  };

  // Handle application approval/rejection
  const handleApplicationStatus = (applicationId: number, status: "accepted" | "rejected") => {
    updateApplicationMutation.mutate({ applicationId, status });
  };

  // Handle mark as paid
  const handleMarkAsPaid = (applicationId: number) => {
    if (!task) return;
    
    // Open payment modal with Stripe integration
    setSelectedApplicationId(applicationId);
    setShowPaymentModal(true);
  };
  
  // Handle payment success
  const handlePaymentSuccess = () => {
    if (!task || !selectedApplicationId) return;
    
    // After successful Stripe payment, create payment record in our system
    markAsPaidMutation.mutate({
      applicationId: selectedApplicationId,
      amount: task.budget,
      status: "completed",
    });
    
    // Close the payment modal
    setShowPaymentModal(false);
    setSelectedApplicationId(null);
  };

  // Handle report task
  const handleReportTask = (reason: string) => {
    reportTaskMutation.mutate(reason);
  };

  // Loading state
  if (isTaskLoading || isApplicationsLoading || isStudentApplicationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Task not found
  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Task Not Found</h1>
          <p className="text-gray-600 mb-4">The task you're looking for doesn't exist or has been removed.</p>
          <Button onClick={goBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Find employer info
  const employer = users?.find(u => u.id === task.employerId);

  // Check if a student application has been accepted
  const acceptedApplication = applications?.find(app => app.status === "accepted");

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Button 
          variant="ghost" 
          onClick={goBack} 
          className="mb-6"
        >
          ← Back
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Task Details */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{task.title}</CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  {task.requiredSkills.map((skill, index) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  ))}
                </div>
                <CardDescription className="flex items-center gap-2 mt-2">
                  <Calendar className="h-4 w-4" />
                  Posted on {format(new Date(task.createdAt), "MMMM d, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Budget</p>
                      <p className="font-medium">₹{task.budget}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-orange-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Deadline</p>
                      <p className="font-medium">{format(new Date(task.deadline), "MMMM d, yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Posted By</p>
                      <p className="font-medium">{employer?.fullName || "Unknown"}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className={`h-5 w-5 rounded-full mr-2 ${
                      task.status === "open" ? "bg-blue-500" :
                      task.status === "in-progress" ? "bg-orange-500" : "bg-green-500"
                    }`} />
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium capitalize">{task.status}</p>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <div className="text-gray-700 whitespace-pre-line">
                    {task.description}
                  </div>
                </div>
                
                {/* Alert for student with accepted application */}
                {user?.role === "student" && studentApplication?.status === "accepted" && (
                  <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                      <div>
                        <h3 className="text-sm font-medium text-green-800">
                          Your application was accepted!
                        </h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>You can now chat with the employer to discuss the details.</p>
                        </div>
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowChat(true)}
                            className="text-green-700 bg-green-100 hover:bg-green-200"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Open Chat
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <div className="w-full flex flex-wrap gap-4 justify-between items-center">
                  {user?.role === "student" && (
                    <div>
                      {task.status === "open" ? (
                        hasApplied ? (
                          <Button disabled variant="secondary">
                            Already Applied
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => setIsApplyDialogOpen(true)}
                          >
                            Apply for this Task
                          </Button>
                        )
                      ) : (
                        <Button disabled variant="secondary">
                          {task.status === "in-progress" ? "Task In Progress" : "Task Completed"}
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {user?.role === "employer" && task.employerId === user.id && (
                    <div className="space-x-3">
                      <Button variant="outline">Edit Task</Button>
                      {task.status === "open" && (
                        <Button variant="destructive">Close Task</Button>
                      )}
                    </div>
                  )}
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Report
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Report this task</AlertDialogTitle>
                        <AlertDialogDescription>
                          Please explain why you're reporting this task. Your report will be reviewed by an administrator.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <Textarea 
                        placeholder="Describe the issue..." 
                        className="min-h-[100px]"
                        id="report-reason"
                      />
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            const reason = (document.getElementById("report-reason") as HTMLTextAreaElement).value;
                            if (reason.trim().length > 0) {
                              handleReportTask(reason);
                            } else {
                              toast({
                                title: "Report failed",
                                description: "Please provide a reason for the report.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          Submit Report
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardFooter>
            </Card>
          </div>
          
          {/* Right Sidebar */}
          <div className="md:col-span-1">
            {/* Employer Only: Applicants */}
            {user?.role === "employer" && task.employerId === user.id && applications && applications.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Applicants ({applications.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-200">
                    {applications.map((application) => {
                      const student = users?.find(u => u.id === application.studentId);
                      
                      return (
                        <div key={application.id} className="px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="font-medium text-gray-700">
                                  {student?.fullName.split(' ').map(part => part[0]).join('').toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{student?.fullName || "Unknown"}</p>
                                <p className="text-xs text-gray-500">
                                  Applied {format(new Date(application.appliedAt), "MMM d")}
                                </p>
                              </div>
                            </div>
                            {application.status === "applied" ? (
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm"
                                  onClick={() => handleApplicationStatus(application.id, "accepted")}
                                >
                                  Accept
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleApplicationStatus(application.id, "rejected")}
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <Badge 
                                variant={application.status === "accepted" ? "default" : "secondary"}
                              >
                                {application.status}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="mt-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="link" className="p-0 h-auto text-sm">
                                  View application
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Application Details</DialogTitle>
                                  <DialogDescription>
                                    Cover letter and details from {student?.fullName || "applicant"}
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Cover Letter</h4>
                                    <p className="text-sm text-gray-700 whitespace-pre-line">
                                      {application.coverLetter}
                                    </p>
                                  </div>
                                  
                                  {student?.skills && student.skills.length > 0 && (
                                    <div className="space-y-2">
                                      <h4 className="font-medium text-sm">Skills</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {student.skills.map((skill, index) => (
                                          <Badge key={index} variant="outline">{skill}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {application.status === "accepted" && task.status === "in-progress" && (
                                  <DialogFooter>
                                    <Button
                                      onClick={() => handleMarkAsPaid(application.id)}
                                      disabled={markAsPaidMutation.isPending}
                                    >
                                      {markAsPaidMutation.isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                      )}
                                      Pay & Complete Task
                                    </Button>
                                  </DialogFooter>
                                )}
                              </DialogContent>
                            </Dialog>
                          </div>
                          
                          {application.status === "accepted" && (
                            <div className="mt-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setShowChat(true)}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Open Chat
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Similar Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Similar Tasks</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {tasks?.filter(t => 
                    t.id !== task.id && 
                    t.status === "open" && 
                    t.requiredSkills.some(skill => task.requiredSkills.includes(skill))
                  ).slice(0, 3).map((similarTask) => (
                    <div 
                      key={similarTask.id} 
                      className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => window.location.href = `/tasks/${similarTask.id}`}
                    >
                      <h3 className="text-sm font-medium text-gray-900">{similarTask.title}</h3>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {similarTask.requiredSkills.slice(0, 2).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {similarTask.requiredSkills.length > 2 && (
                          <span className="text-xs text-gray-500">+{similarTask.requiredSkills.length - 2} more</span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-medium">₹{similarTask.budget}</span>
                        <span className="text-xs text-gray-500">
                          Due {format(new Date(similarTask.deadline), "MMM d")}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {(!tasks || tasks.filter(t => 
                    t.id !== task.id && 
                    t.status === "open" && 
                    t.requiredSkills.some(skill => task.requiredSkills.includes(skill))
                  ).length === 0) && (
                    <div className="px-6 py-8 text-center">
                      <p className="text-sm text-gray-500">No similar tasks found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Chat Dialog */}
        <Dialog open={showChat} onOpenChange={setShowChat}>
          <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Chat - {task.title}</DialogTitle>
              <DialogDescription>
                Communicate directly about the task details
              </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-hidden">
              <ChatInterface 
                applicationId={
                  user?.role === "student" 
                    ? studentApplication?.id || 0
                    : acceptedApplication?.id || 0
                }
                receiverId={
                  user?.role === "student"
                    ? task.employerId
                    : acceptedApplication?.studentId || 0
                }
              />
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Application Dialog */}
        <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply for {task.title}</DialogTitle>
              <DialogDescription>
                Tell the employer why you're the perfect fit for this task.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onApplySubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="coverLetter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Letter</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your relevant experience and why you're interested in this task"
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsApplyDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={applyMutation.isPending}
                  >
                    {applyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Payment Modal */}
        {task && selectedApplicationId && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={handlePaymentSuccess}
            applicationId={selectedApplicationId}
            amount={task.budget}
            taskTitle={task.title}
          />
        )}
      </div>
    </div>
  );
};

export default TaskDetail;
