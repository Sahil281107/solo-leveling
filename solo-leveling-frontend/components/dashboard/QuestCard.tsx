import { Clock, Zap, CheckCircle } from 'lucide-react';
import { getDifficultyColor, formatTime } from '@/lib/utils';

interface QuestCardProps {
  quest: any;
  onComplete: () => void;
}

export default function QuestCard({ quest, onComplete }: QuestCardProps) {
  return (
    <div className={`quest-card glass p-6 rounded-xl ${quest.is_completed ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-2">{quest.quest_title}</h3>
          <div className="flex items-center gap-4 text-sm">
            <span className={`px-2 py-1 rounded border ${getDifficultyColor(quest.difficulty)}`}>
              {quest.difficulty}
            </span>
            <span className="flex items-center gap-1 text-yellow-400">
              <Zap className="w-4 h-4" />
              {quest.base_xp} XP
            </span>
            {quest.related_stat && (
              <span className="text-gray-400">
                +{quest.related_stat}
              </span>
            )}
          </div>
        </div>
        {quest.is_completed ? (
          <CheckCircle className="w-6 h-6 text-green-400" />
        ) : (
          <Clock className="w-6 h-6 text-gray-400" />
        )}
      </div>
      
      {!quest.is_completed && (
        <>
          <p className="text-sm text-gray-400 mb-4">
            {formatTime(quest.expires_at)}
          </p>
          <button
            onClick={onComplete}
            className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 font-semibold"
          >
            Complete Quest
          </button>
        </>
      )}
    </div>
  );
}