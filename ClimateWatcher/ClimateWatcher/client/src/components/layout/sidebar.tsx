import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, Home, ClipboardList, MessageSquare, User, 
  Medal, Briefcase, Users, ShieldCheck, Flag, Settings, 
  LogOut, ChevronLeft, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const { user, logoutMutation } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [location, navigate] = useLocation();
  
  // Detect mobile screens on mount and hide sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Check initially
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  // Define navigation items
  const navItems = [
    {
      name: "Home",
      icon: <Home className="h-5 w-5" />,
      href: "/",
      roles: ["student", "employer", "admin"],
    },
    {
      name: "Dashboard",
      icon: <Home className="h-5 w-5" />,
      href: `/${user?.role}/dashboard`,
      roles: ["student", "employer", "admin"],
    },
    {
      name: "Browse Tasks",
      icon: <ClipboardList className="h-5 w-5" />,
      href: "/tasks",
      roles: ["student"],
    },
    {
      name: "Messages",
      icon: <MessageSquare className="h-5 w-5" />,
      href: "/messages",
      roles: ["student", "employer", "admin"],
    },
    {
      name: "Profile",
      icon: <User className="h-5 w-5" />,
      href: "/profile",
      roles: ["student", "employer", "admin"],
    },
    {
      name: "Badges",
      icon: <Medal className="h-5 w-5" />,
      href: "/badges",
      roles: ["student"],
    },
    // Employer only
    {
      name: "My Tasks",
      icon: <Briefcase className="h-5 w-5" />,
      href: "/employer/tasks",
      roles: ["employer"],
    },
    {
      name: "Applicants",
      icon: <Users className="h-5 w-5" />,
      href: "/employer/applicants",
      roles: ["employer"],
    },
    // Admin only
    {
      name: "User Management",
      icon: <ShieldCheck className="h-5 w-5" />,
      href: "/admin/users",
      roles: ["admin"],
    },
    {
      name: "Reports",
      icon: <Flag className="h-5 w-5" />,
      href: "/admin/reports",
      roles: ["admin"],
    },
    {
      name: "Settings",
      icon: <Settings className="h-5 w-5" />,
      href: "/admin/settings",
      roles: ["admin"],
    },
  ];
  
  // Filter nav items by user role
  const filteredNavItems = navItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );
  
  return (
    <>
      {/* Sidebar toggle button for mobile (visible on smaller screens) */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 right-4 z-50 lg:hidden"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>
      
      {/* Main sidebar */}
      <aside 
        className={cn(
          "w-64 bg-white border-r border-gray-200 fixed inset-y-0 z-40 transition-transform duration-300 ease-in-out",
          collapsed ? "-translate-x-full" : "translate-x-0",
          "lg:translate-x-0 lg:static lg:z-0"
        )}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">Pay4Skill</h1>
          </div>
          
          <nav className="space-y-1 flex-grow">
            {filteredNavItems.map((item) => {
              const isActive = location === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.href);
                  }}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </a>
              );
            })}
          </nav>
          
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-700 font-medium">
                  {user?.fullName ? getInitials(user.fullName) : "?"}
                </span>
              </div>
              <div className="flex-grow min-w-0">
                <p className="font-medium text-sm truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-500 capitalize truncate">{user?.role}</p>
              </div>
            </div>
            
            {/* Visible Logout Button */}
            <button 
              className="w-full flex items-center gap-2 px-3 py-2 text-red-600 rounded-md border border-red-200 hover:bg-red-50 transition-colors"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? (
                <>
                  <span className="animate-pulse">...</span>
                  <span>Logging out</span>
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
      
      {/* Overlay to close sidebar on mobile when clicked outside */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}
    </>
  );
};

export default Sidebar;
