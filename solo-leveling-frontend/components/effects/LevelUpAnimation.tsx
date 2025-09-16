export default function LevelUpAnimation({ level }: { level: number }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="level-up">
        <div className="text-8xl font-game font-bold text-yellow-400 glow animate-bounce">
          LEVEL UP!
        </div>
        <div className="text-4xl font-bold text-white mt-4 text-center">
          You reached Level {level}!
        </div>
      </div>
    </div>
  );
}