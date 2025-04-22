import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InsertTask } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";

// Task form schema
const taskSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  budget: z.coerce.number().positive("Budget must be a positive number"),
  deadline: z.string().refine(date => {
    // Make sure deadline is in the future
    return new Date(date) > new Date();
  }, "Deadline must be in the future"),
  requiredSkills: z.string().min(3, "Please enter at least one skill"),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  onSuccess?: () => void;
}

const TaskForm = ({ onSuccess }: TaskFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Initialize form
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      budget: undefined,
      deadline: format(addDays(new Date(), 7), "yyyy-MM-dd"),
      requiredSkills: "",
    }
  });
  
  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: InsertTask) => {
      const res = await apiRequest("POST", "/api/tasks", data);
      return res.json();
    },
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      
      toast({
        title: "Task created",
        description: "Your task has been successfully created.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Task creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Submit handler
  const onSubmit = (data: TaskFormValues) => {
    if (!user) return;
    
    // Parse skills from comma-separated string to array
    const requiredSkills = data.requiredSkills
      .split(',')
      .map(skill => skill.trim())
      .filter(Boolean);
    
    // Make sure the deadline is properly formatted as an ISO string
    const deadlineDate = new Date(data.deadline);
    // Set the time to end of the day to avoid timezone issues
    deadlineDate.setHours(23, 59, 59, 999);
    
    createTaskMutation.mutate({
      title: data.title,
      description: data.description,
      budget: data.budget,
      deadline: deadlineDate,
      requiredSkills,
      employerId: user.id,
      status: "open",
    });
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Website Redesign" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe the task in detail..." 
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget (₹)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" placeholder="e.g. 5000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deadline</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="requiredSkills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Required Skills (comma separated)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. JavaScript, React, UI Design" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={createTaskMutation.isPending}
          >
            {createTaskMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Task"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TaskForm;
