
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminData } from "@/hooks/useAdminData";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminTabNavigation, AdminTab } from "@/components/admin/AdminTabNavigation";
import { OverviewTab } from "@/components/admin/OverviewTab";
import { RSSFeedsTab } from "@/components/admin/RSSFeedsTab";
import { MonitoringTab } from "@/components/admin/MonitoringTab";
import { AddDeathTab } from "@/components/admin/AddDeathTab";
import { ManageDeathsTab } from "@/components/admin/ManageDeathsTab";
import { WikipediaLookupManager } from "@/components/admin/WikipediaLookupManager";

const AdminDashboard = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const navigate = useNavigate();

  const {
    deceasedCelebrities,
    users,
    picks,
    rssFeeds,
    fetchLogs,
    addFeedMutation,
    toggleFeedMutation
  } = useAdminData();

  useEffect(() => {
    if (!user || !profile?.is_admin) {
      navigate("/login");
    }
  }, [user, profile, navigate]);

  if (!user || !profile?.is_admin) {
    return null;
  }

  const totalHits = picks.filter(pick => pick.is_hit).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <AdminHeader username={profile.username} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <AdminTabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

          {activeTab === 'overview' && (
            <OverviewTab
              usersCount={users.length}
              deceasedCelebritiesCount={deceasedCelebrities.length}
              totalHits={totalHits}
            />
          )}

          {activeTab === 'feeds' && (
            <RSSFeedsTab
              rssFeeds={rssFeeds}
              addFeedMutation={addFeedMutation}
              toggleFeedMutation={toggleFeedMutation}
            />
          )}

          {activeTab === 'monitoring' && (
            <MonitoringTab fetchLogs={fetchLogs} />
          )}

          {activeTab === 'addDeath' && <AddDeathTab />}

          {activeTab === 'manageDeath' && (
            <ManageDeathsTab deceasedCelebrities={deceasedCelebrities} />
          )}

          {/* Add Wikipedia Lookup Manager as a new section */}
          <div className="mt-8">
            <WikipediaLookupManager />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
