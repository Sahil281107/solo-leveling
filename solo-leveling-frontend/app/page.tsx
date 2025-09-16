'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Zap, Target, Trophy, Users, Sword, Shield, Sparkles, ChevronDown, Play } from 'lucide-react';

export default function LandingPage() {
  const [currentBg, setCurrentBg] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  // Solo Leveling themed background images from local folder
  const backgrounds = [
    '/images/backgrounds/solo-leveling-1.jpg',
    '/images/backgrounds/solo-leveling-2.jpg',
    '/images/backgrounds/solo-leveling-3.jpg',
    '/images/backgrounds/solo-leveling-4.jpg',
  ];

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    
    // Change background every 5 seconds
    const bgTimer = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 5000);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(bgTimer);
    };
  }, []);

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
        {/* Background Images */}
        {backgrounds.map((bg, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: currentBg === index ? 1 : 0,
              transition: 'opacity 2s ease-in-out',
              transform: `scale(${currentBg === index ? 1 : 1.1})`,
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
                filter: 'brightness(0.7) contrast(1.2) saturate(1.2)',
                transform: `translateY(${scrollY * 0.5}px)`,
              }}
            />
          </div>
        ))}
        
        {/* Gradient Overlays */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.7) 100%)',
        }} />
        
        {/* Vignette Effect for better edge darkening */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.4) 100%)',
        }} />
        
        {/* Purple Glow Effects */}
        <div style={{
          position: 'absolute',
          top: '25%',
          left: '25%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.25) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'pulse 4s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '25%',
          right: '25%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'pulse 4s ease-in-out infinite 2s',
        }} />
      </div>

      {/* Navigation Bar */}
      <nav style={{ 
        position: 'relative',
        zIndex: 20,
        padding: '24px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            padding: '12px 24px',
            background: 'rgba(147, 51, 234, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            border: '1px solid rgba(147, 51, 234, 0.4)',
          }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '900',
              letterSpacing: '2px',
              background: 'linear-gradient(to right, #a855f7, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
              fontFamily: 'Orbitron, monospace'
            }}>
              SOLO LEVELING
            </h1>
            <div style={{ 
              fontSize: '10px',
              color: '#a855f7',
              letterSpacing: '4px',
              textAlign: 'center',
              marginTop: '4px'
            }}>
              SYSTEM
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link href="/login" style={{ textDecoration: 'none' }}>
            <button style={{
              position: 'relative',
              padding: '12px 24px',
              background: 'rgba(147, 51, 234, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(147, 51, 234, 0.4)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              letterSpacing: '1px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(147, 51, 234, 0.3)';
              e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.6)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(147, 51, 234, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.4)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <Shield size={18} />
              LOGIN
            </button>
          </Link>

          <Link href="/signup" style={{ textDecoration: 'none' }}>
            <button style={{
              position: 'relative',
              padding: '12px 32px',
              background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '700',
              letterSpacing: '1px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 20px rgba(147, 51, 234, 0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 30px rgba(147, 51, 234, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(147, 51, 234, 0.4)';
            }}>
              START NOW
              <ArrowRight size={18} />
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
        textAlign: 'center',
      }}>
        {/* Subtle background for text area */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: '1000px',
          height: '600px',
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        {/* Animated Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 24px',
          background: 'rgba(147, 51, 234, 0.3)',
          backdropFilter: 'blur(10px)',
          borderRadius: '999px',
          border: '1px solid rgba(147, 51, 234, 0.6)',
          marginBottom: '32px',
          animation: 'pulse 2s ease-in-out infinite',
        }}>
          <Sparkles size={16} style={{ color: '#a855f7' }} />
          <span style={{ color: '#e9d5ff', fontSize: '14px', fontWeight: '700', letterSpacing: '1px' }}>
            ARISE & LEVEL UP
          </span>
          <Sparkles size={16} style={{ color: '#a855f7' }} />
        </div>

        {/* Main Title */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: 'clamp(48px, 8vw, 96px)',
            fontWeight: '900',
            lineHeight: '1',
            marginBottom: '16px',
            fontFamily: 'Orbitron, monospace',
            textShadow: '0 0 60px rgba(147, 51, 234, 0.8), 0 4px 12px rgba(0, 0, 0, 0.8)',
          }}>
            <span style={{ display: 'block', marginBottom: '8px', color: '#ffffff', textShadow: '0 4px 12px rgba(0, 0, 0, 0.9)' }}>BECOME THE</span>
            <span style={{
              display: 'block',
              background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 50%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundSize: '200% auto',
              animation: 'gradientShift 3s ease infinite',
            }}>
              SHADOW MONARCH
            </span>
          </h1>
        </div>

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(18px, 2vw, 24px)',
          color: '#d1d5db',
          marginBottom: '48px',
          maxWidth: '800px',
          lineHeight: '1.6',
          fontWeight: '300',
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.7)',
        }}>
          Transform your life into an epic quest. Level up daily, conquer challenges, 
          and rise from <span style={{ color: '#a855f7', fontWeight: '600' }}>E-Rank</span> to 
          <span style={{ color: '#fbbf24', fontWeight: '600' }}> S-Rank</span> in real life.
        </p>

        {/* CTA Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '24px',
          marginBottom: '64px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <Link href="/signup" style={{ textDecoration: 'none' }}>
            <button style={{
              position: 'relative',
              padding: '20px 40px',
              background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 50%, #9333ea 100%)',
              backgroundSize: '200% auto',
              border: 'none',
              borderRadius: '16px',
              color: '#fff',
              fontSize: '18px',
              fontWeight: '700',
              letterSpacing: '1px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 10px 40px rgba(147, 51, 234, 0.5)',
              animation: 'gradientShift 3s ease infinite',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
              e.currentTarget.style.boxShadow = '0 15px 50px rgba(147, 51, 234, 0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(147, 51, 234, 0.5)';
            }}>
              <Sword size={24} />
              BEGIN YOUR JOURNEY
              <ArrowRight size={24} />
            </button>
          </Link>

          <button style={{
            padding: '20px 40px',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            borderRadius: '16px',
            color: '#fff',
            fontSize: '18px',
            fontWeight: '700',
            letterSpacing: '1px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
            e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.8)';
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
          }}>
            <Play size={24} />
            WATCH TRAILER
          </button>
        </div>

        {/* Live Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px',
          maxWidth: '800px',
          width: '100%',
        }}>
          {[
            { icon: Users, label: 'Active Players', value: '10,523', color: '#a855f7' },
            { icon: Trophy, label: 'Quests Completed', value: '1.2M+', color: '#3b82f6' },
            { icon: Zap, label: 'Total Levels Gained', value: '85,421', color: '#fbbf24' },
          ].map((stat, index) => (
            <div
              key={index}
              style={{
                position: 'relative',
                padding: '24px',
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: '1px solid rgba(147, 51, 234, 0.3)',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.8)';
                e.currentTarget.style.background = 'rgba(147, 51, 234, 0.2)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(147, 51, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.3)';
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <stat.icon size={32} style={{ color: stat.color, margin: '0 auto 12px' }} />
              <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Scroll Indicator */}
        <div style={{
          position: 'absolute',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          animation: 'bounce 2s ease-in-out infinite',
        }}>
          <ChevronDown size={32} style={{ color: '#a855f7' }} />
        </div>
      </div>

      {/* Features Section */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        padding: '80px 24px',
        background: 'linear-gradient(to top, #000 0%, rgba(0,0,0,0.95) 50%, transparent 100%)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{
              fontSize: 'clamp(36px, 5vw, 48px)',
              fontWeight: '900',
              marginBottom: '16px',
              fontFamily: 'Orbitron, monospace',
              background: 'linear-gradient(to right, #a855f7, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              SYSTEM FEATURES
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '18px' }}>
              Power up with exclusive features
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
          }}>
            {[
              { icon: Zap, title: 'Daily Quests', description: '8 personalized quests every day', gradient: 'linear-gradient(135deg, #fbbf24, #f97316)' },
              { icon: Target, title: 'Stat System', description: 'Track STR, INT, AGI & more', gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
              { icon: Trophy, title: 'Achievements', description: 'Unlock titles and rewards', gradient: 'linear-gradient(135deg, #a855f7, #ec4899)' },
              { icon: Users, title: 'Guild System', description: 'Join forces with others', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
            ].map((feature, index) => (
              <div
                key={index}
                style={{
                  position: 'relative',
                  padding: '32px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px',
                  border: '1px solid rgba(147, 51, 234, 0.3)',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                  e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.8)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(147, 51, 234, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.3)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  display: 'inline-flex',
                  padding: '12px',
                  borderRadius: '12px',
                  background: feature.gradient,
                  marginBottom: '16px',
                }}>
                  <feature.icon size={24} style={{ color: '#fff' }} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
                  {feature.title}
                </h3>
                <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inline Styles for Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.2); }
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-10px); }
        }
      `}</style>
    </div>
  );
}