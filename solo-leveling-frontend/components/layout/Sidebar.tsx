'use client';

interface SidebarProps {
  userType: 'adventurer' | 'coach';
  onLogout: () => void;
}

export default function Sidebar({ userType, onLogout }: SidebarProps) {
  // Get current path without using Next.js navigation
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';

  const adventurerLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/dashboard/quests', label: 'Quests', icon: '⚔️' },
    { href: '/dashboard/stats', label: 'Stats', icon: '📊' },
    { href: '/dashboard/achievements', label: 'Achievements', icon: '🏆' },
    { href: '/dashboard/calendar', label: 'Calendar', icon: '📅' },
  ];

  const coachLinks = [
    { href: '/coach', label: 'Dashboard', icon: '🏠' },
    { href: '/coach/students', label: 'Students', icon: '👥' },
    { href: '/coach/progress', label: 'Progress', icon: '📊' },
    { href: '/coach/feedback', label: 'Feedback', icon: '🎯' },
  ];

  const links = userType === 'coach' ? coachLinks : adventurerLinks;

  const handleNavigation = (href: string) => {
    window.location.href = href;
  };

  return (
    <div className="w-64 h-screen bg-gray-900 border-r border-gray-800">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white">
          SOLO LEVELING
        </h2>
        <p className="text-xs text-gray-400 mt-1">System v1.0</p>
      </div>

      <nav className="px-4">
        {links.map((link) => {
          const isActive = pathname === link.href;
          
          return (
            <button
              key={link.href}
              onClick={() => handleNavigation(link.href)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all text-left ${
                isActive 
                  ? 'bg-indigo-600 text-white' 
                  : 'hover:bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <span className="text-xl">{link.icon}</span>
              <span className="font-medium">{link.label}</span>
              {isActive && (
                <div className="ml-auto w-1 h-4 bg-white rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-900 text-gray-400 hover:text-red-400 transition-all"
        >
          <span className="text-xl">🚪</span>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}