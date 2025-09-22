'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getUser, logout } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import QuestManagementModal from '@/components/admin/QuestManagementModal';
import AdminStats from '@/components/admin/AdminStats';
import UserManagement from '@/components/admin/UserManagement';
import AdminLogs from '@/components/admin/AdminLogs';
import { 
  Shield, Users, Activity, Settings, LogOut,
  BarChart3, Clock, AlertCircle, Database, Crown
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [currentBg, setCurrentBg] = useState(0);
  const [showQuestModal, setShowQuestModal] = useState(false); // NEW: Quest modal state

  // Solo Leveling themed backgrounds - SAME AS COACH DASHBOARD
  const backgrounds = [
    '/images/backgrounds/solo-leveling-1.jpg',
    '/images/backgrounds/solo-leveling-2.jpg',
    '/images/backgrounds/solo-leveling-3.jpg',
    '/images/backgrounds/solo-leveling-4.jpg',
  ];

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

  // ADDED: Background rotation - SAME AS COACH DASHBOARD
  useEffect(() => {
    const bgTimer = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 5000);
    
    return () => clearInterval(bgTimer);
  }, []);

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
      <div style={{ 
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* ADDED: Animated Background for loading - SAME AS COACH */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
          {backgrounds.map((bg, index) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: currentBg === index ? 1 : 0,
                transition: 'opacity 2s ease-in-out',
                transform: `scale(${currentBg === index ? 1 : 1.1})`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${bg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  filter: 'brightness(0.5) contrast(1.2) saturate(1.2)',
                  transform: 'scale(1.1)',
                }}
              />
            </div>
          ))}
          
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.8) 100%)',
          }} />
          
          {/* ADDED: Purple Glow Effects */}
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '20%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, transparent 70%)',
            filter: 'blur(100px)',
            animation: 'pulse 4s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '20%',
            right: '20%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
            filter: 'blur(100px)',
            animation: 'pulse 4s ease-in-out infinite 2s',
          }} />
        </div>

        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid rgba(147, 51, 234, 0.3)',
            borderTopColor: '#9333ea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#9ca3af', fontSize: '18px' }}>Initializing Admin Portal...</p>
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
    <div style={{ 
      position: 'relative',
      minHeight: '100vh',
      overflow: 'hidden',
      backgroundColor: '#000',
      color: '#fff',
      fontFamily: 'Inter, -apple-system, sans-serif'
    }}>
      {/* ADDED: Animated Background System - SAME AS COACH DASHBOARD */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        {backgrounds.map((bg, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: currentBg === index ? 1 : 0,
              transition: 'opacity 2s ease-in-out',
              transform: `scale(${currentBg === index ? 1 : 1.1})`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${bg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: 'brightness(0.5) contrast(1.2) saturate(1.2)',
                transform: 'scale(1.1)',
              }}
            />
          </div>
        ))}
        
        {/* ADDED: Gradient Overlays */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.8) 100%)',
        }} />
        
        {/* ADDED: Purple Glow Effects - Signature Solo Leveling Style */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '20%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, transparent 70%)',
          filter: 'blur(100px)',
          animation: 'pulse 4s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '20%',
          right: '20%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
          filter: 'blur(100px)',
          animation: 'pulse 4s ease-in-out infinite 2s',
        }} />
      </div>

      {/* Admin Header - ENHANCED WITH GLASSMORPHISM */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(147, 51, 234, 0.2)'
      }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {/* ADDED: Crown Icon for Admin */}
              <div style={{
                background: 'linear-gradient(135deg, #9333ea, #ec4899)',
                padding: '10px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(147, 51, 234, 0.5)'
              }}>
                <Crown className="w-6 h-6" style={{ color: '#fff' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: '900',
                  fontFamily: 'Orbitron, monospace',
                  background: 'linear-gradient(to right, #a855f7, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 40px rgba(168, 85, 247, 0.5)',
                }}>
                  SYSTEM ADMIN
                </h1>
                <p className="text-gray-400 text-sm">Solo Leveling System Control Center</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div style={{
                background: 'rgba(147, 51, 234, 0.1)',
                padding: '8px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(147, 51, 234, 0.3)'
              }}>
                <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                  Welcome, <span style={{ color: '#fff', fontWeight: '600' }}>{user?.username}</span>
                </p>
                <p style={{ fontSize: '11px', color: '#a855f7', fontWeight: '600' }}>
                  {user?.profile?.access_level || 'SUPER ADMIN'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  color: '#ef4444',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8" style={{ position: 'relative', zIndex: 10 }}>
        {/* Tab Navigation - SUPER ENHANCED */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '32px',
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '8px',
          border: '1px solid rgba(147, 51, 234, 0.2)'
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: isActive ? 'linear-gradient(135deg, #9333ea, #ec4899)' : 'transparent',
                  border: isActive ? '1px solid rgba(147, 51, 234, 0.5)' : '1px solid transparent',
                  borderRadius: '12px',
                  color: isActive ? '#fff' : '#9ca3af',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '14px',
                  fontWeight: '600',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isActive ? '0 4px 20px rgba(147, 51, 234, 0.4)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  } else {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 6px 25px rgba(147, 51, 234, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                    e.currentTarget.style.transform = 'translateY(0)';
                  } else {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(147, 51, 234, 0.4)';
                  }
                }}
              >
                {/* Shine effect for active tab */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                    transform: 'rotate(45deg)',
                    animation: 'shimmer 3s infinite'
                  }} />
                )}
                <Icon style={{ width: '18px', height: '18px', position: 'relative', zIndex: 1 }} />
                <span style={{ position: 'relative', zIndex: 1 }}>{tab.label}</span>
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    right: '0',
                    height: '3px',
                    background: 'linear-gradient(to right, #fff, rgba(255, 255, 255, 0.5), #fff)',
                    borderRadius: '0 0 12px 12px'
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area - KEPT YOUR ORIGINAL LOGIC */}
        <div className="min-h-[600px]">
        {activeTab === 'dashboard' && (
          <div className="animate-fadeIn">
            <AdminStats 
              stats={stats} 
              onRefresh={fetchDashboardStats}
              onQuestsClick={() => setShowQuestModal(true)}
            />
          </div>
        )}
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

{/* Quest Management Modal */}
      <QuestManagementModal 
        isOpen={showQuestModal}
        onClose={() => setShowQuestModal(false)}
      />

      {/* ADDED: Animations - SAME AS COACH DASHBOARD */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { 
            opacity: 0.3; 
            transform: scale(1); 
          }
          50% { 
            opacity: 0.5; 
            transform: scale(1.1); 
          }
        }
        
        @keyframes spin {
          to { 
            transform: rotate(360deg); 
          }
        }

        @keyframes shimmer {
          0% { 
            transform: translateX(-100%) translateY(-100%) rotate(45deg); 
          }
          100% { 
            transform: translateX(100%) translateY(100%) rotate(45deg); 
          }
        }
      `}</style>
    </div>
  );
}