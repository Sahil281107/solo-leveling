'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { login } from '@/lib/auth';
import { Mail, Lock, Eye, EyeOff, Zap, Sword, Crown, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentBg, setCurrentBg] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Solo Leveling backgrounds
  const backgrounds = [
    '/images/backgrounds/solo-leveling-1.jpg',
    '/images/backgrounds/solo-leveling-2.jpg', 
    '/images/backgrounds/solo-leveling-3.jpg',
    '/images/backgrounds/solo-leveling-4.jpg',
  ];

  const quotes = [
    { text: "I alone shall level up!", author: "Sung Jin-Woo" },
    { text: "The system has chosen you.", author: "System" },
    { text: "Arise and become stronger.", author: "Shadow Monarch" },
    { text: "Your journey begins now.", author: "System Message" }
  ];

  const [currentQuote, setCurrentQuote] = useState(quotes[0]); // Start with first quote
  
  // Set random quote after component mounts (client-side only)
  useEffect(() => {
    setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  useEffect(() => {
    // Change background every 5 seconds
    const bgTimer = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 5000);
    
    return () => clearInterval(bgTimer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await login(formData.email, formData.password);
      console.log("User object from backend:", response.user);

      // Show success message with solo leveling theme
      toast.success(
        `🎯 Welcome back, ${response.user.username}! System activated.`,
        { duration: 3000 }
      );
      
      // Redirect based on user type
      setTimeout(() => {
        if (response.user.user_type === 'coach') {
          router.push('/coach');
        } else {
          router.push('/dashboard');
        }
      }, 1000);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      position: 'relative',
      minHeight: '100vh',
      overflow: 'hidden',
      backgroundColor: '#000',
      color: '#fff',
      fontFamily: 'Inter, -apple-system, sans-serif'
    }}>
      {/* Animated Background System */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        {backgrounds.map((bg, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: currentBg === index ? 1 : 0,
              transition: 'opacity 2s ease-in-out',
              transform: `scale(${currentBg === index ? 1.05 : 1.1})`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${bg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: 'brightness(0.4) contrast(1.3) saturate(1.1)',
              }}
            />
          </div>
        ))}
        
        {/* Enhanced Gradient Overlays */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 30% 20%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 70% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
            linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.8) 100%)
          `,
        }} />
        
        {/* Animated Purple Energy */}
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'pulse 3s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'pulse 4s ease-in-out infinite 1.5s',
        }} />
      </div>

      {/* Main Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{ width: '100%', maxWidth: '500px' }}>
          {/* System Badge */}
          <div style={{
            textAlign: 'center',
            marginBottom: '32px',
            animation: 'fadeIn 1s ease-out',
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 32px',
              background: 'rgba(147, 51, 234, 0.2)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              border: '1px solid rgba(147, 51, 234, 0.5)',
              marginBottom: '16px',
            }}>
              <Crown size={24} style={{ color: '#a855f7' }} />
              <span style={{ 
                fontSize: '14px', 
                fontWeight: '700', 
                letterSpacing: '2px',
                color: '#e9d5ff',
                textTransform: 'uppercase'
              }}>
                Shadow Monarch System
              </span>
              <Crown size={24} style={{ color: '#a855f7' }} />
            </div>
            
            {/* Inspirational Quote */}
            <div style={{
              padding: '16px 24px',
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              border: '1px solid rgba(147, 51, 234, 0.3)',
              marginBottom: '24px',
            }}>
              <p style={{ 
                fontSize: '16px', 
                fontStyle: 'italic',
                color: '#d1d5db',
                marginBottom: '8px',
                lineHeight: '1.4'
              }}>
                "{currentQuote.text}"
              </p>
              <p style={{ 
                fontSize: '12px', 
                color: '#a855f7',
                fontWeight: '600'
              }}>
                — {currentQuote.author}
              </p>
            </div>
          </div>

          {/* Login Form Container */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(147, 51, 234, 0.4)',
            padding: '48px',
            boxShadow: `
              0 25px 50px rgba(0, 0, 0, 0.5),
              0 0 0 1px rgba(147, 51, 234, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `,
            animation: 'slideUp 0.8s ease-out',
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
                borderRadius: '50%',
                marginBottom: '20px',
                boxShadow: '0 10px 30px rgba(147, 51, 234, 0.5)',
              }}>
                <Sword size={40} style={{ color: '#fff' }} />
              </div>
              
              <h1 style={{
                fontSize: '36px',
                fontWeight: '900',
                marginBottom: '8px',
                fontFamily: 'Orbitron, monospace',
                background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 30px rgba(147, 51, 234, 0.5)',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}>
                Player Login
              </h1>
              
              <p style={{ 
                color: '#9ca3af', 
                fontSize: '16px',
                fontWeight: '300'
              }}>
                Access the Hunter's System
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Email Field */}
              <div>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  color: '#e9d5ff',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  <Mail size={18} />
                  Hunter ID (Email)
                </label>
                <input
                  type="email"
                  required
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '2px solid rgba(147, 51, 234, 0.3)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                  }}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="hunter@system.com"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.8)';
                    e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(147, 51, 234, 0.3)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.3)';
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Password Field */}
              <div>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  color: '#e9d5ff',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  <Lock size={18} />
                  Access Code
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    style={{
                      width: '100%',
                      padding: '16px 50px 16px 20px',
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: '2px solid rgba(147, 51, 234, 0.3)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                    }}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••••••"
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.8)';
                      e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(147, 51, 234, 0.3)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.3)';
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      padding: '4px',
                      transition: 'color 0.3s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#a855f7'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '18px',
                  background: loading 
                    ? 'linear-gradient(135deg, #6b7280, #9ca3af)'
                    : 'linear-gradient(135deg, #9333ea 0%, #ec4899 50%, #3b82f6 100%)',
                  backgroundSize: '200% auto',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: '700',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  boxShadow: '0 8px 25px rgba(147, 51, 234, 0.4)',
                  animation: !loading ? 'gradientShift 3s ease infinite' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 12px 35px rgba(147, 51, 234, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(147, 51, 234, 0.4)';
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid #fff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }} />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    Enter System
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div style={{
              marginTop: '32px',
              padding: '20px',
              background: 'rgba(147, 51, 234, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              border: '1px solid rgba(147, 51, 234, 0.3)',
            }}>
              <p style={{ 
                fontSize: '12px', 
                color: '#a855f7', 
                marginBottom: '12px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                🎮 Demo Hunter Accounts
              </p>
              <div style={{ fontSize: '14px', color: '#d1d5db', lineHeight: '1.6' }}>
                <p><strong>Adventurer:</strong> test@example.com / password123</p>
                <p><strong>Coach:</strong> coach@example.com / password123</p>
              </div>
            </div>

            {/* Sign Up Link */}
            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <p style={{ color: '#9ca3af', marginBottom: '16px' }}>
                Not registered with the System?
              </p>
              <Link 
                href="/signup"
                style={{ 
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#a855f7',
                  fontWeight: '600',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#c084fc';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#a855f7';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Sword size={18} />
                Create Hunter Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}