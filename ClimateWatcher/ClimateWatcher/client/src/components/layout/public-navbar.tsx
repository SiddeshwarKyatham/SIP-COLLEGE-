import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { GraduationCap, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PublicNavbar = () => {
  let user = null;
  try {
    // Only use auth if we're in an AuthProvider
    const auth = useAuth();
    user = auth.user;
  } catch (error) {
    // Handle not being in an AuthProvider
    console.log("Auth provider not available, continuing as guest");
  }
  const [location, navigate] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Handle navigation based on auth status
  const handleAuthAction = () => {
    if (user) {
      // If logged in, redirect to appropriate dashboard
      switch (user.role) {
        case "student":
          navigate("/student/dashboard");
          break;
        case "employer":
          navigate("/employer/dashboard");
          break;
        case "admin":
          navigate("/admin/dashboard");
          break;
        default:
          navigate("/");
          break;
      }
    } else {
      // If not logged in, go to auth page
      navigate("/auth");
    }
  };
  
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div 
              className="flex-shrink-0 flex items-center cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <h1 className="ml-3 text-xl font-bold">Pay4Skill</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <a 
                href="/"
                className={cn(
                  "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                  location === "/" 
                    ? "border-primary text-gray-900" 
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/");
                }}
              >
                Home
              </a>
              <a 
                href="/about"
                className={cn(
                  "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                  location === "/about" 
                    ? "border-primary text-gray-900" 
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/about");
                }}
              >
                About
              </a>
              <a 
                href="/how-it-works"
                className={cn(
                  "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                  location === "/how-it-works" 
                    ? "border-primary text-gray-900" 
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/how-it-works");
                }}
              >
                How It Works
              </a>
            </div>
          </div>
          
          <div className="hidden sm:flex sm:items-center">
            {!user ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/auth")}
                >
                  Login
                </Button>
                <Button 
                  className="ml-3"
                  onClick={() => navigate("/auth?tab=register")}
                >
                  Sign Up
                </Button>
              </>
            ) : (
              <Button onClick={handleAuthAction}>
                Dashboard
              </Button>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              aria-expanded="false"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      <div className={cn("sm:hidden", !isMenuOpen && "hidden")}>
        <div className="pt-2 pb-3 space-y-1">
          <a
            href="/"
            className={cn(
              "block pl-3 pr-4 py-2 border-l-4 text-base font-medium",
              location === "/" 
                ? "border-primary text-primary bg-primary-50" 
                : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
            )}
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
              setIsMenuOpen(false);
            }}
          >
            Home
          </a>
          <a
            href="/about"
            className={cn(
              "block pl-3 pr-4 py-2 border-l-4 text-base font-medium",
              location === "/about" 
                ? "border-primary text-primary bg-primary-50" 
                : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
            )}
            onClick={(e) => {
              e.preventDefault();
              navigate("/about");
              setIsMenuOpen(false);
            }}
          >
            About
          </a>
          <a
            href="/how-it-works"
            className={cn(
              "block pl-3 pr-4 py-2 border-l-4 text-base font-medium",
              location === "/how-it-works" 
                ? "border-primary text-primary bg-primary-50" 
                : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
            )}
            onClick={(e) => {
              e.preventDefault();
              navigate("/how-it-works");
              setIsMenuOpen(false);
            }}
          >
            How It Works
          </a>
          
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              {!user ? (
                <div className="flex flex-col w-full space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      navigate("/auth");
                      setIsMenuOpen(false);
                    }}
                  >
                    Login
                  </Button>
                  <Button 
                    className="w-full"
                    onClick={() => {
                      navigate("/auth?tab=register");
                      setIsMenuOpen(false);
                    }}
                  >
                    Sign Up
                  </Button>
                </div>
              ) : (
                <Button 
                  className="w-full"
                  onClick={() => {
                    handleAuthAction();
                    setIsMenuOpen(false);
                  }}
                >
                  Dashboard
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;
