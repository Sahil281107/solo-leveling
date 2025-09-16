// components/dashboard/ProfileManager.tsx
import { useState, useEffect } from 'react';
import { Camera, X, User, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Cookies from 'js-cookie';

interface ProfileManagerProps {
  user: any;
  onUpdate?: (updatedUser: any) => void;
}

export default function ProfileManager({ user, onUpdate }: ProfileManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Initialize profile image from user data
// Replace the existing useEffect (lines 19-30) with this enhanced version:
useEffect(() => {
  // EXISTING DEBUG (keep this)
  console.log('ProfileManager - User object:', user);
  console.log('ProfileManager - Profile photo URL:', user?.profile_photo_url);

  // NEW DEBUG CODE (add this)
  console.log('=== ENHANCED DEBUG START ===');
  console.log('Dashboard User Data:', user);
  console.log('Profile Photo URL:', user?.profile_photo_url);
  
  if (user?.profile_photo_url) {
    setProfileImage(user.profile_photo_url);
    console.log('ProfileManager - Set profile image to:', user.profile_photo_url);
    console.log('ProfileManager - Full image URL:', getImageUrl(user.profile_photo_url));
    
    // NEW: Test if URL is accessible
    const fullImageUrl = getImageUrl(user.profile_photo_url);
    if (fullImageUrl && !fullImageUrl.startsWith('data:')) {
      console.log('Testing image accessibility for:', fullImageUrl);
      fetch(fullImageUrl)
        .then(response => {
          console.log('Image fetch status:', response.status);
          if (response.ok) {
            console.log('✅ Image is accessible');
          } else {
            console.log('❌ Image not accessible - Status:', response.status);
          }
        })
        .catch(err => {
          console.log('❌ Image fetch failed:', err);
          console.log('❌ This means the backend URL is not reachable');
        });
    }
  } else {
    console.log('ProfileManager - No profile photo URL found, setting to null');
    console.log('❌ USER HAS NO PROFILE PHOTO URL IN DATA');
    setProfileImage(null);
  }
  console.log('=== ENHANCED DEBUG END ===');
}, [user?.profile_photo_url, user?.user_id]);

 const getImageUrl = (imageUrl: string | null) => {
  if (!imageUrl) {
    console.log('getImageUrl: No image URL provided');
    return null;
  }
  
  console.log('getImageUrl: Raw image URL:', imageUrl);

  // If it's a base64 data URL (for demo mode)
  if (imageUrl.startsWith('data:')) {
    console.log('getImageUrl: Base64 data URL detected');
    return imageUrl;
  }
  
  // If it's already a full URL
  if (imageUrl.startsWith('http')) {
    console.log('getImageUrl: Full URL detected');
    return imageUrl;
  }
  
  // If it starts with /uploads, prepend backend URL
  if (imageUrl.startsWith('/uploads')) {
    const fullUrl = `http://localhost:5000${imageUrl}`;
    console.log('getImageUrl: Constructed full URL:', fullUrl);
    return fullUrl;
  }

  // If it's a relative path, prepend backend URL and /uploads
  const fullUrl = `http://localhost:5000/uploads/${imageUrl}`;
  console.log('getImageUrl: Default construction:', fullUrl);
  return fullUrl;
};
  const updateUserInCookies = (updatedUser: any) => {
    console.log('Updating user in cookies:', updatedUser);
    Cookies.set('user', JSON.stringify(updatedUser), { expires: 7 });
    if (onUpdate) {
      onUpdate(updatedUser);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('profile_photo', file);

    try {
      console.log('Uploading profile photo to backend...');
      const response = await api.post('/users/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log('Upload response:', response.data);
      const newImageUrl = response.data.profile_photo_url;
      
      // Update local state
      setProfileImage(newImageUrl);
      
      // Update user object and cookies
      const updatedUser = { ...user, profile_photo_url: newImageUrl };
      updateUserInCookies(updatedUser);
      
      toast.success('Profile photo updated successfully!');
    } catch (error) {
      console.warn('Backend upload failed, using demo mode:', error);
      
      // For demo mode, use FileReader to create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        console.log('Demo mode: Created data URL for image');
        setProfileImage(dataUrl);
        
        // Update user object and cookies for demo mode
        const updatedUser = { ...user, profile_photo_url: dataUrl };
        updateUserInCookies(updatedUser);
        
        toast.success('Profile photo updated! (Demo mode)');
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      setShowModal(false);
    }
  };

  const removeProfilePhoto = async () => {
    try {
      await api.delete('/users/remove-photo');
      setProfileImage(null);
      
      // Update user object and cookies
      const updatedUser = { ...user, profile_photo_url: null };
      updateUserInCookies(updatedUser);
      
      toast.success('Profile photo removed successfully!');
    } catch (error) {
      console.warn('Backend remove failed, using demo mode:', error);
      
      // For demo mode
      setProfileImage(null);
      
      // Update user object and cookies for demo mode
      const updatedUser = { ...user, profile_photo_url: null };
      updateUserInCookies(updatedUser);
      
      toast.success('Profile photo removed! (Demo mode)');
    }
    setShowModal(false);
  };

  const imageUrl = getImageUrl(profileImage);
  console.log('ProfileManager render - imageUrl:', imageUrl);

  return (
    <>
      <div className="text-center">
        <div className="avatar-container" style={{ width: '150px', height: '150px' }}>
          {imageUrl ? (
            <img 
              src={imageUrl}
              alt="Profile" 
              className="avatar"
              style={{ 
                cursor: 'pointer',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid rgba(147, 51, 234, 0.5)',
              }}
              onClick={() => setShowModal(true)}
              onLoad={() => console.log('Profile image loaded successfully:', imageUrl)}
              onError={(e) => {
                console.error('Failed to load profile image:', imageUrl);
                console.log('Error details:', e);
                // Fallback to placeholder if image fails to load
                setProfileImage(null);
                toast.error('Failed to load profile image');
              }}
            />
          ) : (
            <div 
              className="avatar-placeholder"
              style={{ 
                cursor: 'pointer',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #9333ea, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                fontWeight: 'bold',
                color: 'white',
                textTransform: 'uppercase',
                border: '4px solid rgba(147, 51, 234, 0.5)',
              }}
              onClick={() => setShowModal(true)}
            >
              {user?.username?.[0]?.toUpperCase() || <User size={60} />}
            </div>
          )}
          <button
            className="avatar-upload-btn"
            onClick={() => setShowModal(true)}
            style={{ 
              position: 'absolute',
              bottom: '0',
              right: '0',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #9333ea, #ec4899)',
              border: '3px solid #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Camera size={24} />
          </button>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '12px' }}>
          {user?.username}
        </h2>
        <p className="text-gray-400" style={{ fontSize: '14px' }}>
          {user?.email}
        </p>
      </div>

      {/* Photo Management Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(10px)'
        }}>
          <div className="glass" style={{ maxWidth: '400px', width: '90%', position: 'relative' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 style={{ fontSize: '24px', fontWeight: 'bold' }}>
                Manage Profile Photo
              </h3>
              <button
                onClick={() => setShowModal(false)}
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
              >
                <X size={24} />
              </button>
            </div>

            <div className="text-center">
              {imageUrl && (
                <img 
                  src={imageUrl}
                  alt="Current Profile" 
                  style={{ 
                    width: '150px', 
                    height: '150px', 
                    borderRadius: '50%', 
                    margin: '0 auto 20px',
                    objectFit: 'cover',
                    border: '3px solid rgba(147, 51, 234, 0.5)',
                  }}
                  onError={(e) => {
                    console.error('Failed to load image in modal:', imageUrl);
                  }}
                />
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label 
                  className="btn btn-primary" 
                  style={{ 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 24px'
                  }}
                >
                  <Upload size={20} />
                  {imageUrl ? 'Change Photo' : 'Upload Photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    disabled={isUploading}
                  />
                </label>

                {imageUrl && (
                  <button
                    onClick={removeProfilePhoto}
                    className="btn btn-danger"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px 24px'
                    }}
                  >
                    <X size={20} />
                    Remove Photo
                  </button>
                )}

                <button
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  style={{
                    padding: '12px 24px'
                  }}
                >
                  Cancel
                </button>
              </div>

              {isUploading && (
                <div className="mt-4">
                  <div className="spinner mx-auto"></div>
                  <p className="text-gray-400 mt-2">Uploading...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}