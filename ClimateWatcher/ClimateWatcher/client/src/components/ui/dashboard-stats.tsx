import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface DashboardStatsProps {
  title: string;
  value: string;
  icon: ReactNode;
  description: string;
}

const DashboardStats = ({ title, value, icon, description }: DashboardStatsProps) => {
  return (
    <Card className="p-6 border border-gray-200">
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-blue-100 text-primary">
          {icon}
        </div>
        <div className="ml-4">
          <h2 className="text-xl font-bold text-gray-900">{value}</h2>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-500">{description}</p>
    </Card>
  );
};

export default DashboardStats;
