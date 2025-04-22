import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import PublicNavbar from "@/components/layout/public-navbar";
import Footer from "@/components/layout/footer";
import { GraduationCap, Briefcase, ArrowRight, UserPlus, HandshakeIcon, TrendingUp, MessageSquare, Medal, ShieldCheck } from "lucide-react";

export default function HomePage() {
  let user = null;
  try {
    // Only use auth if we're in an AuthProvider
    const auth = useAuth();
    user = auth.user;
  } catch (error) {
    // Handle not being in an AuthProvider
    console.log("Auth provider not available, continuing as guest");
  }
  const [_, navigate] = useLocation();

  // Handle action button click based on auth status
  const handleActionClick = () => {
    if (user) {
      // Redirect to appropriate dashboard
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
          navigate("/auth");
          break;
      }
    } else {
      // Not logged in, go to auth page
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PublicNavbar />
      
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
            <div className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Get Paid for Your Skills.</span>
                  <span className="block text-primary xl:inline"> Find Opportunities, Deliver Talent.</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  A platform built for college students to showcase their skills and get hired by employers posting real-world tasks.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Button 
                      onClick={handleActionClick}
                      className="w-full flex items-center justify-center px-8 py-3 text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 md:py-4 md:text-lg md:px-10"
                    >
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/auth")}
                      className="w-full flex items-center justify-center px-8 py-3 text-base font-medium rounded-md text-primary bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                    >
                      Hire Talent
                      <Briefcase className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="relative w-full h-64 sm:h-72 md:h-96 lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 lg:h-full">
            <img 
              className="h-full w-full object-cover" 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80" 
              alt="Students collaborating"
            />
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">How It Works</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Simple Steps to Success
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Our platform makes it easy to connect talent with opportunity
            </p>
          </div>
          
          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Create Profile</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Sign up as a student or employer and create your profile with skills and expertise.
                </dd>
              </div>
              
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                    <HandshakeIcon className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Connect</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Students apply to tasks, employers review applications and select talent.
                </dd>
              </div>
              
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Earn & Grow</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Complete tasks, get paid, and build your reputation with badges and ratings.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
      
      {/* Featured Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Why Choose Us</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              The Pay4Skill Advantage
            </p>
          </div>
          
          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white mb-4">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Integrated Chat</h3>
                <p className="mt-2 text-base text-gray-500">
                  Direct communication between students and employers with built-in file sharing.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white mb-4">
                  <Medal className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Reputation System</h3>
                <p className="mt-2 text-base text-gray-500">
                  Earn badges and build credibility through successful task completions and positive reviews.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white mb-4">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Secure Platform</h3>
                <p className="mt-2 text-base text-gray-500">
                  Our platform ensures safe interactions with verified profiles and secure payment processing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
