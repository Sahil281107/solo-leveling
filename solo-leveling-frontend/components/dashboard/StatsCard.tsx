interface StatsCardProps {
  stat: {
    stat_name: string;
    stat_icon?: string;
    current_value: number;
    max_value: number;
  };
}

export default function StatsCard({ stat }: StatsCardProps) {
  const percentage = (stat.current_value / stat.max_value) * 100;
  
  return (
    <div className="glass p-4 rounded-xl hover:bg-white/5 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{stat.stat_icon || '⚡'}</span>
        <span className="text-xl font-bold text-indigo-400">
          {stat.current_value}
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-2">{stat.stat_name}</p>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{stat.current_value}/{stat.max_value}</p>
    </div>
  );
}