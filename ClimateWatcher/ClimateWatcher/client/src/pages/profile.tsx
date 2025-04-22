import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BadgeCheck, Award, BarChart3 } from "lucide-react";
import BadgeDisplay from "@/components/badges/badge-display";
import Sidebar from "@/components/layout/sidebar";

// Profile update schema
const profileSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  bio: z.string().optional(),
  skills: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  // Form setup
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      bio: user?.bio || "",
      skills: user?.skills ? user.skills.join(", ") : "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      // Convert skills string to array
      const skills = data.skills 
        ? data.skills.split(',').map(skill => skill.trim()).filter(Boolean)
        : [];
      
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, {
        ...data,
        skills,
      });
      return res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsEditing(false);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
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

  // Handle form submission
  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  // Handle cancel editing
  const handleCancel = () => {
    form.reset({
      fullName: user?.fullName || "",
      email: user?.email || "",
      bio: user?.bio || "",
      skills: user?.skills ? user.skills.join(", ") : "",
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Profile</h1>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            ) : (
              <div className="space-x-2">
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                <Button 
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Overview */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader className="text-center">
                  <Avatar className="w-24 h-24 mx-auto">
                    <AvatarImage src={user.profilePicture || ""} alt={user.fullName} />
                    <AvatarFallback className="text-2xl">{getInitials(user.fullName)}</AvatarFallback>
                  </Avatar>
                  
                  <CardTitle className="mt-4">{user.fullName}</CardTitle>
                  <CardDescription className="mt-1">@{user.username}</CardDescription>
                  
                  <Badge variant="outline" className="mt-2 capitalize">
                    {user.role}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Email</h3>
                      <p className="mt-1">{user.email}</p>
                    </div>
                    {user.skills && user.skills.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Skills</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {user.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {user.bio && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Bio</h3>
                        <p className="mt-1 text-sm">{user.bio}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Profile Details */}
            <div className="md:col-span-2">
              {isEditing ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Profile</CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-6">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            placeholder="Your full name"
                            {...form.register("fullName")}
                          />
                          {form.formState.errors.fullName && (
                            <p className="text-sm text-red-500">{form.formState.errors.fullName.message}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="Your email address"
                            {...form.register("email")}
                          />
                          {form.formState.errors.email && (
                            <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            placeholder="Tell us about yourself"
                            className="min-h-[100px]"
                            {...form.register("bio")}
                          />
                          {form.formState.errors.bio && (
                            <p className="text-sm text-red-500">{form.formState.errors.bio.message}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="skills">Skills (comma separated)</Label>
                          <Input
                            id="skills"
                            placeholder="e.g. JavaScript, Design, Marketing"
                            {...form.register("skills")}
                          />
                          {form.formState.errors.skills && (
                            <p className="text-sm text-red-500">{form.formState.errors.skills.message}</p>
                          )}
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <Tabs defaultValue="badges">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="badges">
                      <BadgeCheck className="h-4 w-4 mr-2" />
                      Badges
                    </TabsTrigger>
                    <TabsTrigger value="achievements">
                      <Award className="h-4 w-4 mr-2" />
                      Achievements
                    </TabsTrigger>
                    <TabsTrigger value="stats">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Stats
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Badges Tab */}
                  <TabsContent value="badges">
                    <Card>
                      <CardHeader>
                        <CardTitle>Your Badges</CardTitle>
                        <CardDescription>
                          Badges you've earned through your activities on the platform
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <BadgeDisplay />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  {/* Achievements Tab */}
                  <TabsContent value="achievements">
                    <Card>
                      <CardHeader>
                        <CardTitle>Your Achievements</CardTitle>
                        <CardDescription>
                          Milestones and achievements you've reached
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="border rounded-md p-4">
                            <h3 className="font-medium">First Task Completed</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Complete your first task to unlock this achievement
                            </p>
                            <div className="mt-2 bg-gray-100 rounded-full h-2.5">
                              <div className="bg-primary h-2.5 rounded-full w-0"></div>
                            </div>
                          </div>
                          
                          <div className="border rounded-md p-4">
                            <h3 className="font-medium">Skill Master</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Complete 5 tasks in the same skill category
                            </p>
                            <div className="mt-2 bg-gray-100 rounded-full h-2.5">
                              <div className="bg-primary h-2.5 rounded-full w-0"></div>
                            </div>
                          </div>
                          
                          <div className="border rounded-md p-4">
                            <h3 className="font-medium">Rising Star</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Receive 3 positive reviews from employers
                            </p>
                            <div className="mt-2 bg-gray-100 rounded-full h-2.5">
                              <div className="bg-primary h-2.5 rounded-full w-0"></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  {/* Stats Tab */}
                  <TabsContent value="stats">
                    <Card>
                      <CardHeader>
                        <CardTitle>Your Stats</CardTitle>
                        <CardDescription>
                          Performance metrics and activity statistics
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Task Completion Rate</h3>
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                <div className="bg-primary h-2.5 rounded-full w-0"></div>
                              </div>
                              <span className="text-sm font-medium">0%</span>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-sm text-gray-500">Tasks Applied</p>
                              <p className="text-2xl font-bold">0</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-500">Tasks Completed</p>
                              <p className="text-2xl font-bold">0</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-500">Acceptance Rate</p>
                              <p className="text-2xl font-bold">0%</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-500">Total Earned</p>
                              <p className="text-2xl font-bold">₹0</p>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Top Skills</h3>
                            <p className="text-sm text-gray-500">Complete tasks to see your top skills</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
