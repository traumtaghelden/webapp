import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Clock,
  Crown,
  Trash2,
  BarChart3,
  Webhook,
  LogOut,
  Shield,
  Search,
  Eye,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import DashboardOverviewTab from './Admin/DashboardOverviewTab';
import UsersTab from './Admin/UsersTab';
import TrialsTab from './Admin/TrialsTab';
import PremiumTab from './Admin/PremiumTab';
import DeletionsTab from './Admin/DeletionsTab';
import AnalyticsTab from './Admin/AnalyticsTab';
import WebhooksTab from './Admin/WebhooksTab';
import FeedbackTab from './Admin/FeedbackTab';

type TabType = 'dashboard' | 'users' | 'trials' | 'premium' | 'feedback' | 'deletions' | 'analytics' | 'webhooks';

interface Props {
  onSwitchToUserView?: () => void;
}

export default function AdminDashboard({ onSwitchToUserView }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');
  const [hasWedding, setHasWedding] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = '/';
        return;
      }

      const { data, error } = await supabase.rpc('is_admin');

      if (error) {
        console.error('Error checking admin status:', error);
        window.location.href = '/';
        return;
      }

      if (!data) {
        window.location.href = '/';
        return;
      }

      setIsAdmin(true);

      const { data: weddingData } = await supabase
        .from('weddings')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1)
        .maybeSingle();

      setHasWedding(!!weddingData);
    } catch (error) {
      console.error('Error checking admin status:', error);
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users' as TabType, label: 'Users', icon: Users },
    { id: 'trials' as TabType, label: 'Trials', icon: Clock },
    { id: 'premium' as TabType, label: 'Premium', icon: Crown },
    { id: 'feedback' as TabType, label: 'Feedback', icon: MessageSquare },
    { id: 'deletions' as TabType, label: 'Deletions', icon: Trash2 },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
    { id: 'webhooks' as TabType, label: 'Webhooks', icon: Webhook },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c] flex items-center justify-center">
        <div className="text-white text-xl">Lade Admin Dashboard...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c]">
      {/* Header */}
      <header className="bg-[#0A1F3D]/80 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="bg-[#F5B800] p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-sm text-gray-400">Hochzeitsplaner Management</p>
              </div>
            </div>

            {/* Global Search */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Suche nach E-Mail..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* Admin Badge, Switch View & Logout */}
            <div className="flex items-center gap-3">
              <div className="bg-[#F5B800]/20 text-[#F5B800] px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Admin
              </div>
              {hasWedding && onSwitchToUserView && (
                <button
                  onClick={onSwitchToUserView}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all"
                  title="Zur User-Ansicht wechseln"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden md:inline">User-Ansicht</span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1920px] mx-auto px-6 py-6 flex gap-6">
        {/* Sidebar Navigation */}
        <aside className="w-64 flex-shrink-0">
          <nav className="bg-[#0A1F3D]/50 rounded-xl border border-gray-700 p-4 sticky top-24">
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                      isActive
                        ? 'bg-[#F5B800] text-gray-900'
                        : 'bg-transparent text-gray-300 hover:bg-gray-700/30'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && <DashboardOverviewTab globalSearch={globalSearch} />}
          {activeTab === 'users' && <UsersTab globalSearch={globalSearch} />}
          {activeTab === 'trials' && <TrialsTab />}
          {activeTab === 'premium' && <PremiumTab />}
          {activeTab === 'feedback' && <FeedbackTab />}
          {activeTab === 'deletions' && <DeletionsTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'webhooks' && <WebhooksTab />}
        </main>
      </div>
    </div>
  );
}
