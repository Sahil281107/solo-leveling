'use client';
import { Shield, Users, TrendingUp, Award, Activity, Clock, Sparkles, Zap } from 'lucide-react';

interface AdminStatsProps {
  stats: any;
  onRefresh: () => void;
  onQuestsClick?: () => void; // NEW: Add click handler for quests
}

export default function AdminStats({ stats, onRefresh, onQuestsClick }: AdminStatsProps) {
  if (!stats) {
    return (
      <div style={{
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid rgba(147, 51, 234, 0.2)',
        padding: '32px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(147, 51, 234, 0.3)',
          borderTopColor: '#9333ea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p style={{ color: '#9ca3af', fontSize: '16px' }}>Loading statistics...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers || 0,
      icon: Users,
      color: '#9333ea',
      gradient: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
      subtitle: `${stats.activeUsers || 0} active`,
      glow: 'rgba(147, 51, 234, 0.3)'
    },
    {
      title: 'Adventurers',
      value: stats.usersByType?.adventurers || 0,
      icon: Award,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
      subtitle: 'Active players',
      glow: 'rgba(59, 130, 246, 0.3)'
    },
    {
      title: 'Coaches',
      value: stats.usersByType?.coaches || 0,
      icon: Shield,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      subtitle: 'Guiding heroes',
      glow: 'rgba(16, 185, 129, 0.3)'
    },
    {
      title: 'Total Quests',
      value: stats.totalQuests || 0,
      icon: Activity,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      subtitle: 'Active challenges',
      glow: 'rgba(245, 158, 11, 0.3)'
    }
  ];

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <div
              key={index}
              onClick={() => {
                console.log('Card clicked:', stat.title); // DEBUG
                if (stat.title === 'Total Quests' && onQuestsClick) {
                  console.log('Opening quest modal...'); // DEBUG
                  onQuestsClick();
                }
              }}
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                border: '1px solid rgba(147, 51, 234, 0.2)',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                cursor: stat.title === 'Total Quests' ? 'pointer' : 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 8px 30px ${stat.glow}`;
                e.currentTarget.style.borderColor = stat.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.2)';
              }}
            >
              {/* ADD THIS SHIMMER EFFECT */}
  <div style={{
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: `linear-gradient(45deg, transparent, ${stat.glow}, transparent)`,
    transform: 'rotate(45deg)',
    animation: 'shimmer 3s infinite',
    pointerEvents: 'none'
  }} />
              {/* Content */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    background: stat.gradient,
                    padding: '10px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 15px ${stat.glow}`
                  }}>
                    <Icon style={{ width: '24px', height: '24px', color: '#fff' }} />
                  </div>
                  <div style={{
                    background: `${stat.color}20`,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    border: `1px solid ${stat.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Sparkles style={{ width: '12px', height: '12px', color: stat.color }} />
                    <span style={{ fontSize: '11px', color: stat.color, fontWeight: '600' }}>
                      LIVE
                    </span>
                  </div>
                </div>

                <h3 style={{
                  fontSize: '36px',
                  fontWeight: '900',
                  color: '#fff',
                  marginBottom: '4px',
                  fontFamily: 'Orbitron, monospace',
                  textShadow: `0 0 20px ${stat.glow}`
                }}>
                  {stat.value.toLocaleString()}
                </h3>
                
                <p style={{
                  fontSize: '14px',
                  color: '#9ca3af',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px'
                }}>
                  {stat.title}
                </p>

                {stat.subtitle && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <Zap style={{ width: '14px', height: '14px', color: stat.color }} />
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>
                      {stat.subtitle}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Refresh Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onRefresh}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: 'rgba(147, 51, 234, 0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(147, 51, 234, 0.3)',
            borderRadius: '12px',
            color: '#a855f7',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontSize: '14px',
            fontWeight: '600'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(147, 51, 234, 0.3)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(147, 51, 234, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(147, 51, 234, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <Clock style={{ width: '16px', height: '16px' }} />
          Refresh Stats
        </button>
      </div>

      {/* Animations */}
      <style jsx>{`
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
    100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
  }
`}</style>
    </div>
  );
}