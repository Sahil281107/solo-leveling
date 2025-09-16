export default function ProfileSection({ profile }: { profile: any }) {
  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-4">Character Profile</h2>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-400">Class</span>
          <span className="font-semibold">{profile.field_of_interest}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Commitment</span>
          <span className="font-semibold">{profile.commitment_level?.replace('_', ' ')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Experience</span>
          <span className="font-semibold">{profile.experience_level?.replace('_', ' ')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Longest Streak</span>
          <span className="font-semibold text-yellow-400">{profile.longest_streak || 0} days</span>
        </div>
      </div>
    </div>
  );
}
