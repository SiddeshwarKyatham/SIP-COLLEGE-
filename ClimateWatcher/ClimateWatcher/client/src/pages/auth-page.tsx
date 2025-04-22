import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Redirect } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, GraduationCap, Briefcase } from "lucide-react";
import PublicNavbar from "@/components/layout/public-navbar";
import Footer from "@/components/layout/footer";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "employer"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "",
      confirmPassword: "",
      role: "student",
    },
  });

  // Handle login form submission
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  // Handle registration form submission
  const onRegisterSubmit = (data: RegisterFormValues) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  // If user is already logged in, redirect to appropriate dashboard
  if (user) {
    const redirectPath = 
      user.role === "student" ? "/student/dashboard" : 
      user.role === "employer" ? "/employer/dashboard" : 
      user.role === "admin" ? "/admin/dashboard" : "/";
    
    return <Redirect to={redirectPath} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PublicNavbar />
      
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Auth forms */}
          <div className="flex flex-col justify-center">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">
                  {activeTab === "login" ? "Login to Your Account" : "Create an Account"}
                </CardTitle>
                <CardDescription>
                  {activeTab === "login" 
                    ? "Enter your credentials to access your account" 
                    : "Join Pay4Skill to start connecting with opportunities"}
                </CardDescription>
              </CardHeader>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="px-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                </div>
                
                <CardContent className="pt-6">
                  <TabsContent value="login">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="Enter your password" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Logging in...
                            </>
                          ) : (
                            "Login"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="Enter your email" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Choose a username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="Create a password" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="Confirm your password" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>I am a</FormLabel>
                              <div className="grid grid-cols-2 gap-4 pt-2">
                                <Button
                                  type="button"
                                  variant={field.value === "student" ? "default" : "outline"}
                                  className={field.value === "student" ? "" : "border-gray-300"}
                                  onClick={() => field.onChange("student")}
                                >
                                  <GraduationCap className="w-4 h-4 mr-2" />
                                  Student
                                </Button>
                                <Button
                                  type="button"
                                  variant={field.value === "employer" ? "default" : "outline"}
                                  className={field.value === "employer" ? "" : "border-gray-300"}
                                  onClick={() => field.onChange("employer")}
                                >
                                  <Briefcase className="w-4 h-4 mr-2" />
                                  Employer
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating account...
                            </>
                          ) : (
                            "Create Account"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </CardContent>
              </Tabs>
              
              <CardFooter className="flex flex-col space-y-4">
                <div className="text-sm text-gray-500 text-center">
                  {activeTab === "login" ? (
                    <p>
                      Don't have an account?{" "}
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => setActiveTab("register")}
                      >
                        Create one now
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{" "}
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => setActiveTab("login")}
                      >
                        Log in
                      </button>
                    </p>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>
          
          {/* Hero content */}
          <div className="hidden md:flex flex-col justify-center">
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <h1 className="ml-3 text-3xl font-bold">Pay4Skill</h1>
              </div>
              
              <h2 className="text-3xl font-bold tracking-tight">
                <span className="block">Get Paid for Your Skills.</span>
                <span className="block text-primary">Find Opportunities, Deliver Talent.</span>
              </h2>
              
              <p className="text-lg text-gray-600">
                A platform built for college students to showcase their skills and get hired by employers posting real-world tasks.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 rounded-full p-1.5 bg-primary/10 text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">Build Your Portfolio</h3>
                    <p className="mt-1 text-gray-600">Complete real tasks and build a portfolio of work to showcase your skills.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 rounded-full p-1.5 bg-primary/10 text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M20 6h-4a2 2 0 0 1-2-2c0-1.1.9-2 2-2h4a2 2 0 0 1 2 2c0 1.1-.9 2-2 2z"></path><path d="M14 6h-4a2 2 0 0 1-2-2c0-1.1.9-2 2-2h4a2 2 0 0 1 2 2c0 1.1-.9 2-2 2z"></path><path d="M8 6H4a2 2 0 0 1-2-2c0-1.1.9-2 2-2h4a2 2 0 0 1 2 2c0 1.1-.9 2-2 2z"></path><path d="M16 16v-4a2 2 0 0 1 2-2c1.1 0 2 .9 2 2v4a2 2 0 0 1-2 2c-1.1 0-2-.9-2-2z"></path><path d="M11 16v-4a2 2 0 0 1 2-2c1.1 0 2 .9 2 2v4a2 2 0 0 1-2 2c-1.1 0-2-.9-2-2z"></path><path d="M6 16v-4a2 2 0 0 1 2-2c1.1 0 2 .9 2 2v4a2 2 0 0 1-2 2c-1.1 0-2-.9-2-2z"></path><rect x="2" y="14" width="20" height="8" rx="2"></rect></svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">Earn Money</h3>
                    <p className="mt-1 text-gray-600">Get paid for your work and start building your professional income.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 rounded-full p-1.5 bg-primary/10 text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">Connect with Employers</h3>
                    <p className="mt-1 text-gray-600">Build relationships with potential employers for future opportunities.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
