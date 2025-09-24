'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { signup } from '@/lib/auth';
import { Upload, User, Mail, Lock, Target, Clock, Star, Camera, X, ArrowLeft, ArrowRight, Sword, Shield } from 'lucide-react';

const fields = [
  'Elite Athlete', 
  'Academic Excellence', 
  'Physical Fitness', 
  'Professional Growth',
  'Creative Mastery', 
  'Mental Wellness', 
  'Programming Skills', 
  'Language Learning',
  'Music Production', 
  'Content Creation', 
  'Writing & Literature', 
  'Business & Entrepreneurship',
  'Martial Arts', 
  'Cooking & Nutrition', 
  'Public Speaking', 
  'Digital Art & Design',
  'Photography', 
  'Gaming & Esports', 
  'Meditation & Mindfulness', 
  'Social Skills',
  'Financial Literacy', 
  'Scientific Research', 
  'Dance & Movement', 
  'Chess & Strategy',
  'Custom Goal'
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [currentBg, setCurrentBg] = useState(0);
  
  // Form refs for Enter key navigation
  const emailRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const fullNameRef = useRef<HTMLInputElement>(null);
  const fieldRef = useRef<HTMLSelectElement>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    user_type: 'adventurer',
    full_name: '',
    field_of_interest: '',
    commitment_level: '1_hour',
    experience_level: 'beginner'
  });

const [passwordChecks, setPasswordChecks] = useState({
  length: false,
  uppercase: false,
  lowercase: false,
  number: false,
  specialChar: false
});
const validatePasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 6,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    specialChar: (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length === 1
  };
  
  return checks;
};
const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newPassword = e.target.value;
  setFormData({...formData, password: newPassword});
  setPasswordChecks(validatePasswordStrength(newPassword));
};

  // Solo Leveling backgrounds
  const backgrounds = [
    '/images/backgrounds/solo-leveling-1.jpg',
    '/images/backgrounds/solo-leveling-2.jpg',
    '/images/backgrounds/solo-leveling-3.jpg',
    '/images/backgrounds/solo-leveling-4.jpg',
  ];

  useEffect(() => {
    const bgTimer = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 5000);
    
    return () => clearInterval(bgTimer);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setProfileImagePreview(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent, nextRef?: React.RefObject<any>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      } else {
        // Only advance step, don't submit
        handleNextStep();
      }
    }
  };

  const validateStep = (stepNumber: number) => {
    if (stepNumber === 1) {
      if (!formData.email || !formData.username || !formData.password || !formData.confirmPassword) {
        toast.error('Please fill all required fields');
        return false;
      }
      if (!formData.email.includes('@')) {
        toast.error('Please enter a valid email');
        return false;
      }

      const checks = validatePasswordStrength(formData.password);
    if (!checks.length) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (!checks.uppercase) {
      toast.error('Password must contain at least one uppercase letter');
      return false;
    }
    if (!checks.lowercase) {
      toast.error('Password must contain at least one lowercase letter');
      return false;
    }
    if (!checks.number) {
      toast.error('Password must contain at least one number');
      return false;
    }
    if (!checks.specialChar) {
      toast.error('Password must contain exactly one special character');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return false;
    }
    return true;
    } else if (stepNumber === 2) {
      if (!formData.full_name || !formData.field_of_interest) {
        toast.error('Please complete your profile');
        return false;
      }
      return true;
    } else if (stepNumber === 3) {
      if (formData.user_type === 'adventurer') {
        if (!formData.commitment_level || !formData.experience_level) {
          toast.error('Please select your commitment and experience level');
          return false;
        }
      }
      return true;
    }
    return true;
  };

  const handleNextStep = () => {
    console.log('handleNextStep called, current step:', step, 'user_type:', formData.user_type);
    
    if (step === 1 && validateStep(1)) {
      console.log('Moving from step 1 to step 2');
      setStep(2);
    } else if (step === 2 && validateStep(2)) {
      if (formData.user_type === 'adventurer') {
        console.log('Moving from step 2 to step 3 (adventurer)');
        setStep(3);
      } else {
        console.log('Coach signup, submitting from step 2');
        handleSubmit();
      }
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called, step:', step, 'user_type:', formData.user_type);
    
    // Final validation
    if (!validateStep(1) || !validateStep(2)) {
      return;
    }

    // For adventurers, ensure we're on step 3 and step 3 is validated
    if (formData.user_type === 'adventurer') {
      if (step !== 3) {
        console.log('Adventurer not on step 3, not submitting');
        return;
      }
      if (!validateStep(3)) {
        return;
      }
    }

    setLoading(true);
    
    try {
      const submitData = new FormData();
      
      // Add all form fields except confirmPassword
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'confirmPassword') {
          submitData.append(key, value);
        }
      });
      
      // Add profile photo if exists
      if (profileImage) {
        submitData.append('profile_photo', profileImage);
      }

      await signup(submitData);
      toast.success('🎉 Character created successfully! Welcome to Solo Leveling!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.response?.data?.error || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isOnFinalStep = () => {
    return (formData.user_type === 'adventurer' && step === 3) || 
           (formData.user_type === 'coach' && step === 2);
  };

  const canGoToNextStep = () => {
    return (formData.user_type === 'adventurer' && step < 3) || 
           (formData.user_type === 'coach' && step < 2);
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
      {/* Animated Background System (Same as landing page) */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
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
                filter: 'brightness(0.5) contrast(1.2) saturate(1.2)',
                transform: `scale(1.1)`,
              }}
            />
          </div>
        ))}
        
        {/* Gradient Overlays */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.8) 100%)',
        }} />
        
        {/* Purple Glow Effects */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '20%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, transparent 70%)',
          filter: 'blur(100px)',
          animation: 'pulse 4s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '20%',
          right: '20%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
          filter: 'blur(100px)',
          animation: 'pulse 4s ease-in-out infinite 2s',
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
        <div style={{
          width: '100%',
          maxWidth: '600px',
        }}>
          {/* Glass Container */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(147, 51, 234, 0.3)',
            padding: '48px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1 style={{
                fontSize: '48px',
                fontWeight: '900',
                marginBottom: '8px',
                fontFamily: 'Orbitron, monospace',
                background: 'linear-gradient(to right, #a855f7, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 40px rgba(168, 85, 247, 0.5)',
              }}>
                CREATE CHARACTER
              </h1>
              <p style={{ color: '#9ca3af' }}>Step {step} of {formData.user_type === 'coach' ? '2' : '3'}</p>
              
              {/* Progress bar */}
              <div style={{
                width: '100%',
                height: '8px',
                background: 'rgba(147, 51, 234, 0.2)',
                borderRadius: '4px',
                marginTop: '16px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #a855f7, #ec4899)',
                  width: `${(step / (formData.user_type === 'coach' ? 2 : 3)) * 100}%`,
                  transition: 'width 0.3s ease',
                  boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)',
                }} />
              </div>
            </div>

            {/* Form Content - NO form tag here, just div */}
            <div>
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Email */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px', color: '#e9d5ff' }}>
                      <Mail size={18} />
                      Email Address
                    </label>
                    <input
                      ref={emailRef}
                      type="email"
                      required
                      style={{
                        width: '100%',
                        padding: '14px 20px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '2px solid rgba(147, 51, 234, 0.3)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                      }}
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      onKeyPress={(e) => handleKeyPress(e, usernameRef)}
                      placeholder="hunter@example.com"
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.6)';
                        e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.3)';
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
                      }}
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px', color: '#e9d5ff' }}>
                      <User size={18} />
                      Username
                    </label>
                    <input
                      ref={usernameRef}
                      type="text"
                      required
                      style={{
                        width: '100%',
                        padding: '14px 20px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '2px solid rgba(147, 51, 234, 0.3)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                      }}
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      onKeyPress={(e) => handleKeyPress(e, passwordRef)}
                      placeholder="ShadowMonarch"
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.6)';
                        e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.3)';
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
                      }}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px', color: '#e9d5ff' }}>
    <Lock size={18} />
    Password
  </label>
  <input
    ref={passwordRef}
    type="password"
    required
    style={{
      width: '100%',
      padding: '14px 20px',
      background: 'rgba(0, 0, 0, 0.4)',
      border: '2px solid rgba(147, 51, 234, 0.3)',
      borderRadius: '12px',
      color: '#fff',
      fontSize: '16px',
      transition: 'all 0.3s ease',
    }}
    value={formData.password}
    onChange={handlePasswordChange}  // CHANGED: Use new handler
    onKeyPress={(e) => handleKeyPress(e, confirmPasswordRef)}
    placeholder="••••••••"
    onFocus={(e) => {
      e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.6)';
      e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.3)';
      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
                      }}
                    />
                    {/* Password Strength Indicator */}
  {formData.password && (
    <div style={{
      marginTop: '12px',
      padding: '12px',
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '8px',
      border: '1px solid rgba(147, 51, 234, 0.2)'
    }}>
      <p style={{ 
        fontSize: '12px', 
        color: '#a855f7', 
        marginBottom: '8px',
        fontWeight: '600'
      }}>
        Password Requirements:
      </p>
      <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ 
          color: passwordChecks.length ? '#10b981' : '#6b7280',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>{passwordChecks.length ? '✓' : '○'}</span>
          <span>At least 6 characters</span>
        </div>
        <div style={{ 
          color: passwordChecks.uppercase ? '#10b981' : '#6b7280',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>{passwordChecks.uppercase ? '✓' : '○'}</span>
          <span>One uppercase letter (A-Z)</span>
        </div>
        <div style={{ 
          color: passwordChecks.lowercase ? '#10b981' : '#6b7280',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>{passwordChecks.lowercase ? '✓' : '○'}</span>
          <span>One lowercase letter (a-z)</span>
        </div>
        <div style={{ 
          color: passwordChecks.number ? '#10b981' : '#6b7280',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>{passwordChecks.number ? '✓' : '○'}</span>
          <span>One number (0-9)</span>
        </div>
        <div style={{ 
          color: passwordChecks.specialChar ? '#10b981' : '#6b7280',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>{passwordChecks.specialChar ? '✓' : '○'}</span>
          <span>Exactly one special character (@, #, $, etc.)</span>
        </div>
      </div>
    </div>
  )}
                  </div>
                  {/* Confirm Password */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px', color: '#e9d5ff' }}>
                      <Lock size={18} />
                      Confirm Password
                    </label>
                    <input
                      ref={confirmPasswordRef}
                      type="password"
                      required
                      style={{
                        width: '100%',
                        padding: '14px 20px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '2px solid rgba(147, 51, 234, 0.3)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                      }}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      onKeyPress={(e) => handleKeyPress(e)}
                      placeholder="••••••••"
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.6)';
                        e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.3)';
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
                      }}
                    />
                  </div>

                  {/* Character Type */}
                  <div>
                    <label style={{ marginBottom: '12px', display: 'block', fontSize: '14px', color: '#e9d5ff' }}>
                      Character Type
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, user_type: 'adventurer'})}
                        style={{
                          padding: '20px',
                          background: formData.user_type === 'adventurer' 
                            ? 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3))'
                            : 'rgba(0, 0, 0, 0.4)',
                          border: `2px solid ${formData.user_type === 'adventurer' ? 'rgba(147, 51, 234, 0.6)' : 'rgba(147, 51, 234, 0.2)'}`,
                          borderRadius: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          textAlign: 'center',
                        }}
                      >
                        <Sword size={32} style={{ margin: '0 auto 8px', color: '#a855f7' }} />
                        <div style={{ fontWeight: '700', marginBottom: '4px' }}>Adventurer</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>Level up yourself</div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, user_type: 'coach'})}
                        style={{
                          padding: '20px',
                          background: formData.user_type === 'coach' 
                            ? 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3))'
                            : 'rgba(0, 0, 0, 0.4)',
                          border: `2px solid ${formData.user_type === 'coach' ? 'rgba(147, 51, 234, 0.6)' : 'rgba(147, 51, 234, 0.2)'}`,
                          borderRadius: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          textAlign: 'center',
                        }}
                      >
                        <Shield size={32} style={{ margin: '0 auto 8px', color: '#ec4899' }} />
                        <div style={{ fontWeight: '700', marginBottom: '4px' }}>Coach</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>Guide others</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Profile Photo Upload */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      width: '150px',
                      height: '150px',
                      margin: '0 auto',
                      position: 'relative'
                    }}>
                      {profileImagePreview ? (
                        <>
                          <img 
                            src={profileImagePreview} 
                            alt="Profile" 
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '3px solid rgba(147, 51, 234, 0.5)',
                            }}
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            style={{
                              position: 'absolute',
                              top: '0',
                              right: '0',
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                              border: '2px solid #000',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <X size={20} />
                          </button>
                        </>
                      ) : (
                        <>
                          <div style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2))',
                            border: '2px dashed rgba(147, 51, 234, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <User size={60} style={{ color: '#6b7280' }} />
                          </div>
                          <label style={{
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
                          }}>
                            <Camera size={24} />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </>
                      )}
                    </div>
                    <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '12px' }}>
                      {profileImage ? 'Click X to remove' : 'Click camera to upload (optional)'}
                    </p>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#e9d5ff' }}>
                      Full Name
                    </label>
                    <input
                      ref={fullNameRef}
                      type="text"
                      required
                      style={{
                        width: '100%',
                        padding: '14px 20px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '2px solid rgba(147, 51, 234, 0.3)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                      }}
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      onKeyPress={(e) => handleKeyPress(e, fieldRef)}
                      placeholder="Sung Jin-Woo"
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.6)';
                        e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.3)';
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
                      }}
                    />
                  </div>

                  {/* Field of Interest */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px', color: '#e9d5ff' }}>
                      <Target size={18} />
                      Field of Interest
                    </label>
                    <select
                      ref={fieldRef}
                      required
                      style={{
                        width: '100%',
                        padding: '14px 20px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '2px solid rgba(147, 51, 234, 0.3)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                      }}
                      value={formData.field_of_interest}
                      onChange={(e) => setFormData({...formData, field_of_interest: e.target.value})}
                      onKeyPress={(e) => handleKeyPress(e)}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.6)';
                        e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.3)';
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
                      }}
                    >
                      <option value="">Select your quest path</option>
                      {fields.map(field => (
                        <option key={field} value={field} style={{ background: '#1f2937' }}>
                          {field}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {step === 3 && formData.user_type === 'adventurer' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#a855f7', marginBottom: '8px' }}>
                      Customize Your Journey
                    </h3>
                    <p style={{ color: '#9ca3af' }}>
                      Choose your commitment level and experience to get personalized quests
                    </p>
                  </div>

                  {/* Daily Commitment */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '14px', color: '#e9d5ff' }}>
                      <Clock size={18} />
                      Daily Commitment
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {['30_minutes', '1_hour', '2_hours', '3_plus_hours'].map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setFormData({...formData, commitment_level: level})}
                          style={{
                            padding: '16px',
                            background: formData.commitment_level === level 
                              ? 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3))'
                              : 'rgba(0, 0, 0, 0.4)',
                            border: `2px solid ${formData.commitment_level === level ? 'rgba(147, 51, 234, 0.6)' : 'rgba(147, 51, 234, 0.2)'}`,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            color: '#fff',
                            fontWeight: formData.commitment_level === level ? '600' : '400',
                          }}
                        >
                          {level.replace(/_/g, ' ').replace('plus', '+')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Experience Level */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '14px', color: '#e9d5ff' }}>
                      <Star size={18} />
                      Experience Level
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {['beginner', 'some_experience', 'intermediate', 'advanced'].map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setFormData({...formData, experience_level: level})}
                          style={{
                            padding: '16px',
                            background: formData.experience_level === level 
                              ? 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3))'
                              : 'rgba(0, 0, 0, 0.4)',
                            border: `2px solid ${formData.experience_level === level ? 'rgba(147, 51, 234, 0.6)' : 'rgba(147, 51, 234, 0.2)'}`,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            color: '#fff',
                            fontWeight: formData.experience_level === level ? '600' : '400',
                          }}
                        >
                          {level.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    style={{
                      flex: 1,
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                  >
                    <ArrowLeft size={20} />
                    Previous
                  </button>
                )}
                
                {canGoToNextStep() ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    style={{
                      flex: 1,
                      padding: '16px',
                      background: 'linear-gradient(135deg, #9333ea, #ec4899)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '16px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 20px rgba(147, 51, 234, 0.4)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 30px rgba(147, 51, 234, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(147, 51, 234, 0.4)';
                    }}
                  >
                    Next
                    <ArrowRight size={20} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '16px',
                      background: loading 
                        ? 'linear-gradient(135deg, #6b7280, #9ca3af)'
                        : 'linear-gradient(135deg, #9333ea, #ec4899)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '16px',
                      fontWeight: '700',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 20px rgba(147, 51, 234, 0.4)',
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 30px rgba(147, 51, 234, 0.6)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(147, 51, 234, 0.4)';
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
                        Creating Character...
                      </>
                    ) : (
                      <>
                        <Sword size={20} />
                        Start Adventure
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Login Link */}
            <p style={{ textAlign: 'center', marginTop: '24px', color: '#9ca3af' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#a855f7', textDecoration: 'none', fontWeight: '600' }}>
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 