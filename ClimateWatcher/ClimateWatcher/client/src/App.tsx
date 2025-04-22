import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import StudentDashboard from "@/pages/student-dashboard";
import EmployerDashboard from "@/pages/employer-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import TaskDetail from "@/pages/task-detail";
import Profile from "@/pages/profile";
import PaymentSuccessPage from "@/pages/payment-success";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/tasks/:id" component={TaskDetail} />
      <Route path="/payment-success" component={PaymentSuccessPage} />
      
      {/* Protected Routes */}
      <ProtectedRoute 
        path="/student/dashboard" 
        component={StudentDashboard} 
        allowedRoles={["student"]} 
      />
      <ProtectedRoute 
        path="/employer/dashboard" 
        component={EmployerDashboard} 
        allowedRoles={["employer"]} 
      />
      <ProtectedRoute 
        path="/admin/dashboard" 
        component={AdminDashboard} 
        allowedRoles={["admin"]} 
      />
      <ProtectedRoute 
        path="/profile" 
        component={Profile} 
        allowedRoles={["student", "employer", "admin"]} 
      />
      
      {/* Messages Routes */}
      <ProtectedRoute 
        path="/messages" 
        component={() => {
          // Redirect to the proper role-specific messaging page
          const { user } = useAuth();
          const [_, navigate] = useLocation();
          
          useEffect(() => {
            if (user?.role) {
              navigate(`/${user.role}/messages`);
            }
          }, [user]);
          
          return <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>;
        }}
        allowedRoles={["student", "employer", "admin"]} 
      />
      <ProtectedRoute 
        path="/employer/messages" 
        component={EmployerDashboard} 
        allowedRoles={["employer"]} 
      />
      <ProtectedRoute 
        path="/student/messages" 
        component={StudentDashboard} 
        allowedRoles={["student"]} 
      />
      
      {/* Employer Routes - Use strict path matching */}
      <ProtectedRoute 
        path="/employer/dashboard" 
        component={EmployerDashboard} 
        allowedRoles={["employer"]} 
      />
      <ProtectedRoute 
        path="/employer/tasks" 
        component={EmployerDashboard} 
        allowedRoles={["employer"]} 
      />
      <ProtectedRoute 
        path="/employer/applicants" 
        component={EmployerDashboard} 
        allowedRoles={["employer"]} 
      />
      
      {/* Student Routes */}
      <ProtectedRoute 
        path="/badges" 
        component={StudentDashboard} 
        allowedRoles={["student"]} 
      />
      
      {/* Admin Routes */}
      <ProtectedRoute 
        path="/admin/users" 
        component={AdminDashboard} 
        allowedRoles={["admin"]} 
      />
      <ProtectedRoute 
        path="/admin/reports" 
        component={AdminDashboard} 
        allowedRoles={["admin"]} 
      />
      <ProtectedRoute 
        path="/admin/settings" 
        component={AdminDashboard} 
        allowedRoles={["admin"]} 
      />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
