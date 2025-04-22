import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  allowedRoles: string[];
}

export function ProtectedRoute({
  path,
  component: Component,
  allowedRoles,
}: ProtectedRouteProps) {
  // Fetch the current user from auth context
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // If not logged in, redirect to auth page
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If logged in but not authorized for this route
  if (!allowedRoles.includes(user.role)) {
    // Redirect based on role
    let redirectPath = "/";
    if (user.role === "student") {
      redirectPath = "/student/dashboard";
    } else if (user.role === "employer") {
      redirectPath = "/employer/dashboard";
    } else if (user.role === "admin") {
      redirectPath = "/admin/dashboard";
    }
    
    return (
      <Route path={path}>
        <Redirect to={redirectPath} />
      </Route>
    );
  }

  // User is logged in and has the correct role
  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}
