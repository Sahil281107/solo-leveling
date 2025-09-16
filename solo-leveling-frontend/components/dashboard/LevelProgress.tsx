import { TrendingUp } from 'lucide-react';

interface LevelProgressProps {
  level: number;
  currentExp: number;
  expToNext: number;
  totalExp: number;
}

export default function LevelProgress({ level, currentExp, expToNext, totalExp }: LevelProgressProps) {
  const percentage = (currentExp / expToNext) * 100;
  
  return (
    <div className="glass rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold">LV</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold">Level {level}</h2>
            <p className="text-gray-400">Total XP: {totalExp}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Next Level</p>
          <p className="text-2xl font-bold text-indigo-400">{expToNext - currentExp} XP</p>
        </div>
      </div>
      
      <div className="relative">
        <div className="h-8 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 transition-all duration-1000 flex items-center justify-center relative"
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>
        <p className="text-center mt-2 text-sm">
          {currentExp} / {expToNext} XP ({percentage.toFixed(1)}%)
        </p>
      </div>
    </div>
  );
}