import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { 
  Code, 
  Palette, 
  Lock, 
  Award, 
  Database,
  PenTool, 
  BarChart,
  FileText
} from "lucide-react";

interface Badge {
  id: number;
  name: string;
  description: string;
  category: string;
  level: string;
  icon: string;
  awardedAt?: Date;
}

const BadgeDisplay = () => {
  const { user } = useAuth();
  
  // Fetch user badges
  const { data: userBadges, isLoading } = useQuery<Badge[]>({
    queryKey: [`/api/badges/user/${user?.id}`],
    enabled: !!user?.id,
  });
  
  // Fetch all available badges
  const { data: allBadges } = useQuery<Badge[]>({
    queryKey: ['/api/badges'],
  });
  
  // Function to get icon component based on badge icon name
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'code':
        return <Code className="text-primary text-xl" />;
      case 'palette':
        return <Palette className="text-primary text-xl" />;
      case 'database':
        return <Database className="text-primary text-xl" />;
      case 'award':
        return <Award className="text-primary text-xl" />;
      case 'chart':
        return <BarChart className="text-primary text-xl" />;
      case 'pen':
        return <PenTool className="text-primary text-xl" />;
      case 'document':
        return <FileText className="text-primary text-xl" />;
      default:
        return <Award className="text-primary text-xl" />;
    }
  };
  
  // If no badges are loaded yet, show placeholders
  if (isLoading || !allBadges) {
    return (
      <div className="flex flex-wrap gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
            <div className="mt-2 w-16 h-4 bg-gray-200 animate-pulse rounded" />
            <div className="mt-1 w-12 h-3 bg-gray-200 animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }
  
  // Map of badge IDs that user has earned
  const earnedBadgeIds = new Set((userBadges || []).map(badge => badge.id));
  
  // If we have both user badges and all badges, show a mix of earned and locked badges
  return (
    <div className="flex flex-wrap gap-4">
      {/* Show earned badges first */}
      {userBadges?.map((badge) => (
        <div key={badge.id} className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            {getIconComponent(badge.icon)}
          </div>
          <span className="text-sm font-medium">{badge.name}</span>
          <span className="text-xs text-gray-500 capitalize">{badge.level}</span>
        </div>
      ))}
      
      {/* Then show locked badges */}
      {allBadges.filter(badge => !earnedBadgeIds.has(badge.id)).slice(0, 4).map((badge) => (
        <div key={badge.id} className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-2">
            <Lock className="text-gray-400 text-xl" />
          </div>
          <span className="text-sm font-medium">{badge.name}</span>
          <span className="text-xs text-gray-500">Locked</span>
        </div>
      ))}
      
      {/* If no badges are available, show a message */}
      {allBadges.length === 0 && (
        <div className="w-full text-center py-4">
          <p className="text-gray-500">No badges available yet.</p>
        </div>
      )}
    </div>
  );
};

export default BadgeDisplay;
