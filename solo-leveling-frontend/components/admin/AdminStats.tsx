'use client';
import { Shield, Users, TrendingUp, Award, Activity, Clock } from 'lucide-react';

interface AdminStatsProps {
  stats: any;
  onRefresh: () => void;
}

export default function AdminStats({ stats, onRefresh }: AdminStatsProps) {
  if (!stats) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <p className="text-gray-400">Loading statistics...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers || 0,
      icon: Users,
      color: 'purple',
      subtitle: `${stats.activeUsers || 0} active`
    },
    {
      title: 'Adventurers',
      value: stats.usersByType?.adventurers || 0,
      icon: Award,
      color: 'blue',
      subtitle: 'Active players'
    },
    {
      title: 'Coaches',
      value: stats.usersByType?.coaches || 0,
      icon: Shield,
      color: 'green',
      subtitle: 'Guiding heroes'
    },
    {
      title: 'Total Quests',
      value: stats.totalQuests || 0,
      icon: Activity,
      color: 'orange',
      subtitle: 'Active challenges'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="glass rounded-xl p-6 hover:bg-white/10 transition-all">
            <div className="flex justify-between items-start mb-4">
              <stat.icon className={`w-8 h-8 text-${stat.color}-400`} />
              <span className={`text-xs px-2 py-1 rounded-full bg-${stat.color}-500/20 text-${stat.color}-300`}>
                Live
              </span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-gray-400 text-sm">{stat.title}</p>
            {stat.subtitle && (
              <p className="text-xs text-gray-500 mt-2">{stat.subtitle}</p>
            )}
          </div>
        ))}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 
                     border border-purple-500/30 rounded-lg transition-all text-purple-300"
        >
          <Clock className="w-4 h-4" />
          Refresh Stats
        </button>
      </div>
    </div>
  );
}