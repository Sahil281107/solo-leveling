'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getUser, logout } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import AdminStats from '@/components/admin/AdminStats';
import UserManagement from '@/components/admin/UserManagement';
import AdminLogs from '@/components/admin/AdminLogs';
import { 
  Shield, Users, Activity, Settings, LogOut,
  BarChart3, Clock, AlertCircle, Database
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const initAdmin = async () => {
      const userData = await getUser();
      
      if (!userData || userData.user_type !== 'admin') {
        router.push('/login');
        return;
      }
      
      setUser(userData);
      await fetchDashboardStats();
      setLoading(false);
    };

    initAdmin();
  }, [router]);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/admin/dashboard/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to load dashboard statistics');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Initializing Admin Portal...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'logs', label: 'Activity Logs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Admin Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-purple-500/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-500" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Admin Portal
                </h1>
                <p className="text-gray-400 text-sm">Solo Leveling System Control Center</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-gray-300 font-semibold">{user?.username}</p>
                <p className="text-xs text-purple-400">{user?.profile?.access_level || 'Admin'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
              >
                <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 bg-black/30 backdrop-blur-sm rounded-xl p-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="min-h-[600px]">
          {activeTab === 'dashboard' && <AdminStats stats={stats} onRefresh={fetchDashboardStats} />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'logs' && <AdminLogs />}
          {activeTab === 'settings' && (
            <div className="glass rounded-xl p-8 text-center">
              <Database className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <p className="text-gray-400">Settings module coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}