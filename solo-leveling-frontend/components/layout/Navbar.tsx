// components/layout/Navbar.tsx
import { User, LogOut } from 'lucide-react';

interface NavbarProps {
  user: any;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
const getProfileImageUrl = (user: any) => {
  if (!user?.profile_photo_url) return null;

  console.log('Navbar: Profile photo URL from user:', user.profile_photo_url);

  // If it's a base64 data URL (for demo mode)
  if (user.profile_photo_url.startsWith('data:')) {
    return user.profile_photo_url;
  }

  // If backend gave full URL, use it directly
  if (user.profile_photo_url.startsWith("http")) {
    return user.profile_photo_url;
  }

  // If backend gave relative path like "/uploads/profiles/...", add backend URL
  return `http://localhost:5000${user.profile_photo_url}`;
};


  const profileImageUrl = getProfileImageUrl(user);
  console.log('Navbar render: profileImageUrl =', profileImageUrl);

  return (
    <nav style={{ 
      background: 'rgba(0, 0, 0, 0.8)', 
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '16px 0'
    }}>
      <div className="nav-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <h1 className="nav-brand">
            SOLO LEVELING
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <span className="text-gray-400">System</span>
            <span className="text-gray-400">•</span>
            <span className="text-indigo-400" style={{ fontWeight: '600' }}>
              {user?.user_type === 'coach' ? 'Coach Mode' : 'Player Mode'}
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '2px solid rgba(147, 51, 234, 0.5)',
              position: 'relative',
            }}>
              {profileImageUrl ? (
                <img 
                  src={profileImageUrl}
                  alt="Profile"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onLoad={() => console.log('Navbar: Profile image loaded successfully')}
                  onError={(e) => {
                    console.error('Navbar: Failed to load profile image:', profileImageUrl);
                    
                    // Replace with fallback
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.style.background = 'linear-gradient(135deg, #6366f1, #a855f7)';
                      parent.innerHTML = `<span style="color: white; font-weight: bold; font-size: 18px;">${user?.username?.[0]?.toUpperCase() || 'U'}</span>`;
                    }
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '18px'
                }}>
                  {user?.username?.[0]?.toUpperCase() || <User size={20} />}
                </div>
              )}
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '600' }}>{user?.username}</p>
              <p className="text-gray-400" style={{ fontSize: '12px' }}>{user?.email}</p>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            style={{ 
              padding: '8px',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#fff',
              transition: 'background 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}