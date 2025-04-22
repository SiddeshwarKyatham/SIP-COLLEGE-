import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DollarSign, Calendar, Users } from "lucide-react";
import { Task } from "@shared/schema";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  applicationStatus?: string;
  showApplicants?: boolean;
  applicantCount?: number;
}

const TaskCard = ({ 
  task, 
  onClick, 
  applicationStatus,
  showApplicants = false,
  applicantCount = 0
}: TaskCardProps) => {
  // Format deadline
  const formattedDeadline = format(new Date(task.deadline), "MMM d");
  
  // Status badge style
  const getStatusBadge = () => {
    switch (task.status) {
      case "open":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Open</Badge>;
      case "in-progress":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{task.status}</Badge>;
    }
  };
  
  // Application status badge
  const getApplicationBadge = () => {
    if (!applicationStatus) return null;
    
    switch (applicationStatus) {
      case "applied":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Applied</Badge>;
      case "accepted":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Accepted</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{applicationStatus}</Badge>;
    }
  };
  
  return (
    <Card 
      className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900 line-clamp-1">{task.title}</h3>
          <div>
            {applicationStatus ? getApplicationBadge() : getStatusBadge()}
          </div>
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {task.requiredSkills.slice(0, 3).map((skill, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
          {task.requiredSkills.length > 3 && (
            <span className="text-xs text-gray-500">+{task.requiredSkills.length - 3} more</span>
          )}
        </div>
      </div>
      <div className="px-4 py-5 sm:p-6">
        <p className="text-sm text-gray-500 line-clamp-3">
          {task.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
            <span className="text-sm font-medium">₹{task.budget}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 text-gray-400 mr-1" />
            <span className="text-sm text-gray-500">Due {formattedDeadline}</span>
          </div>
        </div>
        
        {showApplicants && applicantCount > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-500">
              <Users className="h-4 w-4 text-gray-400 mr-1" />
              <span>{applicantCount} applicant{applicantCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TaskCard;
