
import { Button } from "@/components/ui/button";
import { Users, Rss, Clock, Plus, Skull } from "lucide-react";

export type AdminTab = 'overview' | 'feeds' | 'monitoring' | 'addDeath' | 'manageDeath';

interface AdminTabNavigationProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
}

export const AdminTabNavigation = ({ activeTab, setActiveTab }: AdminTabNavigationProps) => {
  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: Users },
    { key: 'feeds' as const, label: 'RSS Feeds', icon: Rss },
    { key: 'monitoring' as const, label: 'Monitoring', icon: Clock },
    { key: 'addDeath' as const, label: 'Record Death', icon: Plus },
    { key: 'manageDeath' as const, label: 'Manage Deaths', icon: Skull }
  ];

  return (
    <div className="flex space-x-4 mb-8">
      {tabs.map(({ key, label, icon: Icon }) => (
        <Button
          key={key}
          onClick={() => setActiveTab(key)}
          variant={activeTab === key ? "default" : "outline"}
          className={activeTab === key ? "bg-purple-600" : "border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"}
        >
          <Icon className="h-4 w-4 mr-2" />
          {label}
        </Button>
      ))}
    </div>
  );
};
