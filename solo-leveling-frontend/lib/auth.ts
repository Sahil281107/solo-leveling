import Cookies from 'js-cookie';
import api from './api';

export const login = async (email: string, password: string) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    const { token, user, profile } = response.data;
    
    Cookies.set('token', token, { expires: 7 });
    Cookies.set('user', JSON.stringify(user), { expires: 7 });
    if (profile) {
      Cookies.set('profile', JSON.stringify(profile), { expires: 7 });
    }
    
    return response.data;
  } catch (error: any) {
    // For demo mode, create mock user
    if (error.response?.status === 404 || !error.response) {
      const mockUser = {
        user_id: 1,
        email: email,
        username: email.split('@')[0],
        user_type: email.includes('coach') ? 'coach' : 'adventurer',
        profile_photo_url: null
      };
      
      const mockData = {
        token: 'demo-token-' + Date.now(),
        user: mockUser,
        profile: {
          current_level: 1,
          total_exp: 0,
          current_exp: 0,
          exp_to_next_level: 100,
          streak_days: 0,
          field_of_interest: 'Demo Mode'
        }
      };
      
      Cookies.set('token', mockData.token, { expires: 7 });
      Cookies.set('user', JSON.stringify(mockData.user), { expires: 7 });
      Cookies.set('profile', JSON.stringify(mockData.profile), { expires: 7 });
      
      return mockData;
    }
    throw error;
  }
};

export const signup = async (formData: FormData) => {
  try {
    // Try to send to backend
    const response = await api.post('/auth/signup', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    const { token, user } = response.data;
    
    Cookies.set('token', token, { expires: 7 });
    Cookies.set('user', JSON.stringify(user), { expires: 7 });
    
    return response.data;
  } catch (error: any) {
    // For demo mode, create mock user
    if (error.response?.status === 404 || !error.response) {
      // Extract form data
      const email = formData.get('email') as string;
      const username = formData.get('username') as string;
      const userType = formData.get('user_type') as string;
      const profilePhoto = formData.get('profile_photo') as File;
      
      // Create mock user
      const mockUser = {
        user_id: Date.now(),
        email: email,
        username: username,
        user_type: userType || 'adventurer',
        profile_photo_url: null
      };
      
      // Handle profile photo in demo mode
      if (profilePhoto) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            mockUser.profile_photo_url = reader.result as string;
            
            const mockData = {
              token: 'demo-token-' + Date.now(),
              user: mockUser,
              profile: {
                current_level: 1,
                total_exp: 0,
                current_exp: 0,
                exp_to_next_level: 100,
                streak_days: 0,
                field_of_interest: formData.get('field_of_interest') as string || 'Not Set'
              }
            };
            
            Cookies.set('token', mockData.token, { expires: 7 });
            Cookies.set('user', JSON.stringify(mockData.user), { expires: 7 });
            Cookies.set('profile', JSON.stringify(mockData.profile), { expires: 7 });
            
            resolve(mockData);
          };
          reader.readAsDataURL(profilePhoto);
        });
      } else {
        const mockData = {
          token: 'demo-token-' + Date.now(),
          user: mockUser,
          profile: {
            current_level: 1,
            total_exp: 0,
            current_exp: 0,
            exp_to_next_level: 100,
            streak_days: 0,
            field_of_interest: formData.get('field_of_interest') as string || 'Not Set'
          }
        };
        
        Cookies.set('token', mockData.token, { expires: 7 });
        Cookies.set('user', JSON.stringify(mockData.user), { expires: 7 });
        Cookies.set('profile', JSON.stringify(mockData.profile), { expires: 7 });
        
        return mockData;
      }
    }
    throw error;
  }
};

export const logout = () => {
  Cookies.remove('token');
  Cookies.remove('user');
  Cookies.remove('profile');
  window.location.href = '/login';
};

export const getUser = () => {
  const userStr = Cookies.get('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const updateUser = (updatedUser: any) => {
  Cookies.set('user', JSON.stringify(updatedUser), { expires: 7 });
};

export const isAuthenticated = () => {
  return !!Cookies.get('token');
};

// Helper function to get image URL with proper formatting
export const getProfileImageUrl = (user: any) => {
  if (!user?.profile_photo_url) return null;
  
  const imageUrl = user.profile_photo_url;
  
  // If it's a base64 data URL (for demo mode)
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  // If it's already a full URL
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // If it's a relative path, prepend backend URL
  return `http://localhost:5000${imageUrl}`;
};