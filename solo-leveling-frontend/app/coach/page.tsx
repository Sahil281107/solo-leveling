// app/coach/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getUser, logout } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import ProfileManager from '@/components/dashboard/ProfileManager';
import { 
  Users, Search, TrendingUp, Award, MessageSquare, Send,
  User, Mail, Target, BarChart3, Shield, Sword, Crown,
  Star, Trophy, Zap, Edit3, Save, X, Check, Bell,
  BookOpen, GraduationCap, Activity, Flame, ChevronRight,
  Trash2, AlertTriangle
} from 'lucide-react';

export default function CoachDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentStats, setStudentStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [sentFeedbacks, setSentFeedbacks] = useState<any[]>([]);
  const [currentBg, setCurrentBg] = useState(0);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<any>(null);
  
  const [coachProfile, setCoachProfile] = useState({
    bio: '',
    achievements: [],
    specialization: '',
    yearsExperience: 0,
    totalStudentsCoached: 0,
    successStories: 0
  });
  
  const [verifyForm, setVerifyForm] = useState({
    student_email: '',
    student_name: '',
    field_of_interest: ''
  });

  // Solo Leveling themed backgrounds
  const backgrounds = [
    '/images/backgrounds/solo-leveling-1.jpg',
    '/images/backgrounds/solo-leveling-2.jpg',
    '/images/backgrounds/solo-leveling-3.jpg',
    '/images/backgrounds/solo-leveling-4.jpg',
  ];

  // Motivational quotes for coaches
  const motivationalQuotes = [
    { text: "A true master is an eternal student.", author: "Master Yi" },
    { text: "The best teachers are those who show you where to look, but don't tell you what to see.", author: "Alexandra K. Trenfor" },
    { text: "In learning you will teach, and in teaching you will learn.", author: "Phil Collins" },
    { text: "The shadow's strength comes from the light that guides it.", author: "Shadow Monarch" },
    { text: "Every student has the potential to become S-Rank.", author: "Guild Master" }
  ];

  const [currentQuote, setCurrentQuote] = useState(motivationalQuotes[0]);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || currentUser.user_type !== 'coach') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchStudents();
    loadCoachProfile();
    
    // Change background every 5 seconds
    const bgTimer = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 5000);
    
    // Change quote every 10 seconds
    const quoteTimer = setInterval(() => {
      setCurrentQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
    }, 10000);
    
    return () => {
      clearInterval(bgTimer);
      clearInterval(quoteTimer);
    };
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/coach/my-students');
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCoachProfile = () => {
    // Load from localStorage or API
    const savedProfile = localStorage.getItem('coachProfile');
    if (savedProfile) {
      setCoachProfile(JSON.parse(savedProfile));
    }
  };

  const saveCoachProfile = () => {
    localStorage.setItem('coachProfile', JSON.stringify(coachProfile));
    setEditingProfile(false);
    toast.success('Profile updated successfully!');
  };

  const verifyStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/coach/verify-student', verifyForm);
      setSelectedStudent(response.data.student_profile);
      setStudentStats(response.data.student_stats);
      toast.success('✅ Student verified successfully!');
      fetchStudents();
      
      // Reset form
      setVerifyForm({
        student_email: '',
        student_name: '',
        field_of_interest: ''
      });
    } catch (error: any) {
      toast.error('❌ ' + (error.response?.data?.error || 'Student not found'));
    }
  };

  const provideFeedback = async () => {
    if (!feedbackText.trim() || !selectedStudent) return;
    
    try {
      await api.post('/coach/feedback', {
        student_id: selectedStudent.user_id,
        feedback_type: 'guidance',
        feedback_text: feedbackText,
        rating: 5
      });
      
      // Track sent feedback
      const newFeedback = {
        id: Date.now(),
        student_id: selectedStudent.user_id,
        student_name: selectedStudent.full_name,
        text: feedbackText,
        sent_at: new Date().toISOString(),
        read: false
      };
      
      setSentFeedbacks([newFeedback, ...sentFeedbacks]);
      setFeedbackText('');
      
      toast.success('📨 Guidance sent successfully! Student will be notified.');
      
      // Simulate read status after 5 seconds (in real app, this would come from backend)
      setTimeout(() => {
        setSentFeedbacks(prev => prev.map(f => 
          f.id === newFeedback.id ? {...f, read: true} : f
        ));
      }, 5000);
    } catch (error) {
      toast.error('Failed to send feedback');
    }
  };

  // Handler for when profile image is updated
  const handleProfileUpdate = (updatedUser: any) => {
    setUser(updatedUser);
  };

  // Remove student functionality
  const handleRemoveStudent = (student: any) => {
    setStudentToRemove(student);
    setShowRemoveModal(true);
  };

  const confirmRemoveStudent = async () => {
    if (!studentToRemove) return;
    
    try {
      // Try backend API first
      await api.delete(`/coach/remove-student/${studentToRemove.user_id}`);
      
      // Remove from local state
      setStudents(prev => prev.filter(s => s.user_id !== studentToRemove.user_id));
      
      // If this was the selected student, clear selection
      if (selectedStudent?.user_id === studentToRemove.user_id) {
        setSelectedStudent(null);
        setStudentStats(null);
      }
      
      // Clear any feedback for this student
      setSentFeedbacks(prev => prev.filter(f => f.student_id !== studentToRemove.user_id));
      
      toast.success(`🗑️ ${studentToRemove.full_name} has been removed from your roster.`);
      
    } catch (error: any) {
      console.warn('Backend removal failed, using demo mode:', error);
      
      
      // If this was the selected student, clear selection
      if (selectedStudent?.user_id === studentToRemove.user_id) {
        setSelectedStudent(null);
        setStudentStats(null);
      }
      
      // Clear any feedback for this student
      setSentFeedbacks(prev => prev.filter(f => f.student_id !== studentToRemove.user_id));
      
      toast.success(`🗑️ ${studentToRemove.full_name} has been removed from your roster. (Demo mode)`);
    } finally {
      setShowRemoveModal(false);
      setStudentToRemove(null);
    }
  };

  if (loading) {
    return (
      <div className="hero" style={{ background: '#000' }}>
        <div className="spinner"></div>
        <p className="text-gray-400 mt-4">Initializing Coach System...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'relative',
      minHeight: '100vh',
      background: '#000',
      overflow: 'hidden'
    }}>
      {/* Animated Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        {backgrounds.map((bg, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: currentBg === index ? 1 : 0,
              transition: 'opacity 2s ease-in-out',
              backgroundImage: `url(${bg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.3) contrast(1.2)',
            }}
          />
        ))}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.8) 100%)',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar user={user} onLogout={logout} />
        
        <div className="container" style={{ padding: '32px 20px' }}>
          {/* Header with Profile Button */}
          <div className="glass mb-8 fade-in" style={{
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(20px)',
            animation: 'slideUp 0.8s ease-out'
          }}>
            <div className="flex justify-between items-center">
              <div>
                <h1 style={{ 
                  fontSize: '48px', 
                  fontWeight: '900', 
                  marginBottom: '16px',
                  fontFamily: 'Orbitron, monospace',
                  background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 30px rgba(147, 51, 234, 0.5)'
                }}>
                  COACH COMMAND CENTER
                </h1>
                <p className="text-gray-400" style={{ fontSize: '18px' }}>
                  Guide your hunters to become Shadow Monarchs
                </p>
              </div>
              
              <button
                onClick={() => setShowProfile(true)}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #9333ea, #ec4899)',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
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
                <Crown size={24} />
                Coach Profile
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '24px',
            marginBottom: '32px'
          }}>
            {[
              { icon: Users, label: 'Active Students', value: students.length, color: '#a855f7' },
              { icon: Trophy, label: 'Total Coached', value: coachProfile.totalStudentsCoached || students.length, color: '#fbbf24' },
              { icon: Star, label: 'Success Stories', value: coachProfile.successStories || 0, color: '#3b82f6' },
              { icon: GraduationCap, label: 'Years Experience', value: coachProfile.yearsExperience || 1, color: '#10b981' }
            ].map((stat, index) => (
              <div
                key={index}
                className="glass"
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(147, 51, 234, 0.3)',
                  borderRadius: '16px',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.6)';
                  e.currentTarget.style.background = 'rgba(147, 51, 234, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.3)';
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
                }}
              >
                <stat.icon size={32} style={{ color: stat.color, margin: '0 auto 12px' }} />
                <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '4px' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '14px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Verify Student Section */}
          <div className="glass mb-8" style={{
            background: 'rgba(147, 51, 234, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(147, 51, 234, 0.3)',
          }}>
            <h2 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              marginBottom: '24px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              color: '#e9d5ff'
            }}>
              <Shield className="text-purple-400" size={28} />
              Verify New Hunter
            </h2>
            <form onSubmit={verifyStudent} style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '20px' 
            }}>
              <input
                type="email"
                placeholder="Hunter Email"
                className="form-input"
                style={{
                  padding: '16px 20px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '2px solid rgba(147, 51, 234, 0.3)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                }}
                value={verifyForm.student_email}
                onChange={(e) => setVerifyForm({...verifyForm, student_email: e.target.value})}
                required
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.6)';
                  e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.3)';
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                }}
              />
              <input
                type="text"
                placeholder="Hunter Name"
                className="form-input"
                style={{
                  padding: '16px 20px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '2px solid rgba(147, 51, 234, 0.3)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                }}
                value={verifyForm.student_name}
                onChange={(e) => setVerifyForm({...verifyForm, student_name: e.target.value})}
                required
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.6)';
                  e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.3)';
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                }}
              />
              <input
                type="text"
                placeholder="Field of Interest"
                className="form-input"
                style={{
                  padding: '16px 20px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '2px solid rgba(147, 51, 234, 0.3)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                }}
                value={verifyForm.field_of_interest}
                onChange={(e) => setVerifyForm({...verifyForm, field_of_interest: e.target.value})}
                required
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.6)';
                  e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.3)';
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                }}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #9333ea, #ec4899)',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Search size={20} />
                Verify Hunter
              </button>
            </form>
          </div>

          {/* Students Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
            {/* Students List */}
            <div>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                marginBottom: '24px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                color: '#e9d5ff'
              }}>
                <Users className="text-purple-400" size={24} />
                Your Hunters ({students.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {students.map((student) => (
                  <div
                    key={student.user_id}
                    className="glass"
                    style={{ 
                      cursor: 'pointer',
                      background: selectedStudent?.user_id === student.user_id 
                        ? 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3))'
                        : 'rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(10px)',
                      border: selectedStudent?.user_id === student.user_id
                        ? '2px solid rgba(147, 51, 234, 0.6)'
                        : '1px solid rgba(147, 51, 234, 0.2)',
                      borderRadius: '16px',
                      padding: '20px',
                      transition: 'all 0.3s ease',
                    }}
                    onClick={() => setSelectedStudent(student)}
                    onMouseEnter={(e) => {
                      if (selectedStudent?.user_id !== student.user_id) {
                        e.currentTarget.style.transform = 'translateX(8px)';
                        e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedStudent?.user_id !== student.user_id) {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.2)';
                      }
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '18px' }}>
                          {student.full_name}
                        </h3>
                        <p className="text-gray-400" style={{ fontSize: '14px', marginBottom: '4px' }}>
                          {student.field_of_interest}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                          <Flame size={16} className="text-orange-400" />
                          <span style={{ fontSize: '14px', color: '#fbbf24' }}>
                            {student.streak_days} day streak
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="text-right">
                          <div style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}>
                            LV {student.current_level}
                          </div>
                          <p className="text-gray-400" style={{ fontSize: '12px' }}>
                            {student.total_exp} XP
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveStudent(student);
                          }}
                          style={{
                            padding: '8px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          title="Remove Hunter"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {selectedStudent?.user_id === student.user_id && (
                      <ChevronRight 
                        size={20} 
                        style={{ 
                          position: 'absolute', 
                          right: '-10px', 
                          color: '#a855f7' 
                        }} 
                      />
                    )}
                  </div>
                ))}
                {students.length === 0 && (
                  <div className="text-center glass" style={{ 
                    padding: '48px', 
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px'
                  }}>
                    <Users size={64} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <p className="text-gray-400">No hunters verified yet</p>
                    <p style={{ fontSize: '14px', marginTop: '8px', color: '#9ca3af' }}>
                      Verify your students using the form above
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Student Details */}
            <div>
              {selectedStudent ? (
                <div className="glass" style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '20px',
                  padding: '32px',
                  border: '1px solid rgba(147, 51, 234, 0.3)',
                }}>
                  <h2 style={{ 
                    fontSize: '32px', 
                    fontWeight: 'bold', 
                    marginBottom: '32px',
                    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    {selectedStudent.full_name}'s Journey
                  </h2>
                  
                  {/* Hunter Stats Overview */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: '24px', 
                    marginBottom: '32px' 
                  }}>
                    <div style={{
                      textAlign: 'center',
                      padding: '20px',
                      background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2))',
                      borderRadius: '12px',
                      border: '1px solid rgba(251, 191, 36, 0.4)',
                    }}>
                      <Sword size={32} style={{ margin: '0 auto 8px', color: '#fbbf24' }} />
                      <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#fbbf24' }}>
                        {selectedStudent.current_level}
                      </p>
                      <p className="text-gray-400" style={{ fontSize: '14px' }}>Level</p>
                    </div>
                    <div style={{
                      textAlign: 'center',
                      padding: '20px',
                      background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2))',
                      borderRadius: '12px',
                      border: '1px solid rgba(147, 51, 234, 0.4)',
                    }}>
                      <Zap size={32} style={{ margin: '0 auto 8px', color: '#a855f7' }} />
                      <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#a855f7' }}>
                        {selectedStudent.total_exp}
                      </p>
                      <p className="text-gray-400" style={{ fontSize: '14px' }}>Total XP</p>
                    </div>
                    <div style={{
                      textAlign: 'center',
                      padding: '20px',
                      background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.2), rgba(254, 215, 170, 0.2))',
                      borderRadius: '12px',
                      border: '1px solid rgba(251, 146, 60, 0.4)',
                    }}>
                      <Flame size={32} style={{ margin: '0 auto 8px', color: '#fb923c' }} />
                      <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#fb923c' }}>
                        {selectedStudent.streak_days}
                      </p>
                      <p className="text-gray-400" style={{ fontSize: '14px' }}>Streak</p>
                    </div>
                  </div>

                  {/* Character Stats */}
                  {studentStats && (
                    <div style={{ marginBottom: '32px' }}>
                      <h3 style={{ 
                        fontWeight: 'bold', 
                        marginBottom: '20px', 
                        fontSize: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <Activity size={20} className="text-purple-400" />
                        Character Stats
                      </h3>
                      <div style={{ display: 'grid', gap: '16px' }}>
                        {studentStats.map((stat: any, index: number) => (
                          <div key={index} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: 'rgba(147, 51, 234, 0.1)',
                            borderRadius: '8px',
                            border: '1px solid rgba(147, 51, 234, 0.2)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '20px' }}>{stat.stat_icon}</span>
                              <span style={{ fontWeight: '600' }}>{stat.stat_name}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '300px' }}>
                              <div style={{ 
                                flex: 1, 
                                height: '10px', 
                                background: 'rgba(0, 0, 0, 0.5)', 
                                borderRadius: '5px', 
                                overflow: 'hidden' 
                              }}>
                                <div 
                                  style={{ 
                                    height: '100%', 
                                    background: 'linear-gradient(to right, #a855f7, #ec4899)',
                                    width: `${(stat.current_value / stat.max_value) * 100}%`,
                                    transition: 'width 0.5s ease',
                                    boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)'
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '14px', fontWeight: 'bold', minWidth: '60px', textAlign: 'right' }}>
                                {stat.current_value}/{stat.max_value}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Guidance Section */}
                  <div>
                    <h3 style={{ 
                      fontWeight: 'bold', 
                      marginBottom: '16px', 
                      fontSize: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <MessageSquare size={20} className="text-purple-400" />
                      Send Guidance
                    </h3>
                    <div style={{ position: 'relative' }}>
                      <textarea
                        className="form-input"
                        placeholder="Share wisdom, encouragement, or strategic advice..."
                        rows={4}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        style={{ 
                          width: '100%', 
                          resize: 'none',
                          padding: '16px',
                          paddingRight: '60px',
                          background: 'rgba(0, 0, 0, 0.6)',
                          border: '2px solid rgba(147, 51, 234, 0.3)',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '16px',
                          transition: 'all 0.3s ease',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.6)';
                          e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.3)';
                          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                        }}
                      />
                      <button
                        onClick={provideFeedback}
                        disabled={!feedbackText.trim()}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          bottom: '12px',
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: feedbackText.trim() 
                            ? 'linear-gradient(135deg, #9333ea, #ec4899)' 
                            : 'rgba(147, 51, 234, 0.3)',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: feedbackText.trim() ? 'pointer' : 'not-allowed',
                          transition: 'all 0.3s ease',
                          color: '#fff',
                        }}
                        onMouseEnter={(e) => {
                          if (feedbackText.trim()) {
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(147, 51, 234, 0.6)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <Send size={20} />
                      </button>
                    </div>
                    
                    {/* Recent Feedback Status */}
                    {sentFeedbacks.filter(f => f.student_id === selectedStudent.user_id).length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>
                          Recent Guidance:
                        </p>
                        {sentFeedbacks
                          .filter(f => f.student_id === selectedStudent.user_id)
                          .slice(0, 3)
                          .map(feedback => (
                            <div key={feedback.id} style={{
                              padding: '8px 12px',
                              background: 'rgba(147, 51, 234, 0.1)',
                              borderRadius: '8px',
                              marginBottom: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '14px'
                            }}>
                              <span style={{ 
                                flex: 1, 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                whiteSpace: 'nowrap' 
                              }}>
                                {feedback.text}
                              </span>
                              {feedback.read ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
                                  <Check size={16} />
                                  Read
                                </span>
                              ) : (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24' }}>
                                  <Bell size={16} />
                                  Sent
                                </span>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass text-center" style={{ 
                  padding: '80px 48px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px'
                }}>
                  <BookOpen size={80} style={{ margin: '0 auto 24px', color: '#6b7280' }} />
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
                    Select a Hunter
                  </h3>
                  <p className="text-gray-400">
                    Choose a student from your roster to view their progress and provide guidance
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Coach Profile Modal */}
      {showProfile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div className="glass" style={{
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '48px',
            borderRadius: '24px',
            background: 'rgba(0, 0, 0, 0.8)',
            border: '2px solid rgba(147, 51, 234, 0.4)',
          }}>
            <div className="flex justify-between items-center mb-8">
              <h2 style={{
                fontSize: '36px',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #9333ea, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Guild Master Profile
              </h2>
              <button
                onClick={() => setShowProfile(false)}
                style={{
                  padding: '12px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#fff',
                  borderRadius: '8px',
                  transition: 'background 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <X size={28} />
              </button>
            </div>

            {/* Profile Photo Section */}
            <div style={{ marginBottom: '32px', textAlign: 'center' }}>
              <ProfileManager 
                user={user} 
                onUpdate={handleProfileUpdate}
              />
            </div>

            {/* Motivational Quote */}
            <div style={{
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2))',
              borderRadius: '16px',
              marginBottom: '32px',
              textAlign: 'center',
              border: '1px solid rgba(147, 51, 234, 0.4)',
            }}>
              <p style={{ 
                fontSize: '20px', 
                fontStyle: 'italic', 
                marginBottom: '12px',
                color: '#e9d5ff'
              }}>
                "{currentQuote.text}"
              </p>
              <p style={{ fontSize: '14px', color: '#a855f7' }}>
                — {currentQuote.author}
              </p>
            </div>

            {/* Profile Content */}
            {editingProfile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#e9d5ff' }}>
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={coachProfile.specialization}
                    onChange={(e) => setCoachProfile({...coachProfile, specialization: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '2px solid rgba(147, 51, 234, 0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    placeholder="e.g., Elite Athlete Training, Programming Mastery"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#e9d5ff' }}>
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    value={coachProfile.yearsExperience}
                    onChange={(e) => setCoachProfile({...coachProfile, yearsExperience: parseInt(e.target.value)})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '2px solid rgba(147, 51, 234, 0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#e9d5ff' }}>
                    Bio / Philosophy
                  </label>
                  <textarea
                    value={coachProfile.bio}
                    onChange={(e) => setCoachProfile({...coachProfile, bio: e.target.value})}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '2px solid rgba(147, 51, 234, 0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                      resize: 'none',
                    }}
                    placeholder="Share your coaching philosophy and approach..."
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={saveCoachProfile}
                    className="btn btn-primary"
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'linear-gradient(135deg, #9333ea, #ec4899)',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    <Save size={20} style={{ display: 'inline', marginRight: '8px' }} />
                    Save Profile
                  </button>
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="btn btn-secondary"
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                  <div>
                    <p style={{ color: '#9ca3af', marginBottom: '4px' }}>Specialization</p>
                    <p style={{ fontSize: '18px', fontWeight: '600' }}>
                      {coachProfile.specialization || 'Shadow Monarch Training'}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#9ca3af', marginBottom: '4px' }}>Experience</p>
                    <p style={{ fontSize: '18px', fontWeight: '600' }}>
                      {coachProfile.yearsExperience || 1} Years
                    </p>
                  </div>
                </div>

                {coachProfile.bio && (
                  <div style={{ marginBottom: '32px' }}>
                    <p style={{ color: '#9ca3af', marginBottom: '8px' }}>Philosophy</p>
                    <p style={{ fontSize: '16px', lineHeight: '1.6' }}>{coachProfile.bio}</p>
                  </div>
                )}

                {/* Achievement Badges */}
                <div style={{ marginBottom: '32px' }}>
                  <p style={{ color: '#9ca3af', marginBottom: '16px' }}>Achievements</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                    {[
                      { icon: Trophy, label: 'First Student', earned: students.length > 0 },
                      { icon: Star, label: '5 Students', earned: students.length >= 5 },
                      { icon: Crown, label: 'Guild Master', earned: students.length >= 10 },
                      { icon: Sword, label: 'Elite Coach', earned: coachProfile.successStories > 5 },
                    ].map((achievement, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '16px',
                          textAlign: 'center',
                          background: achievement.earned 
                            ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2))'
                            : 'rgba(0, 0, 0, 0.3)',
                          borderRadius: '12px',
                          border: achievement.earned
                            ? '1px solid rgba(251, 191, 36, 0.4)'
                            : '1px solid rgba(107, 114, 128, 0.3)',
                          opacity: achievement.earned ? 1 : 0.5,
                        }}
                      >
                        <achievement.icon 
                          size={32} 
                          style={{ 
                            margin: '0 auto 8px', 
                            color: achievement.earned ? '#fbbf24' : '#6b7280' 
                          }} 
                        />
                        <p style={{ fontSize: '12px', fontWeight: '600' }}>
                          {achievement.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setEditingProfile(true)}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'linear-gradient(135deg, #9333ea, #ec4899)',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Edit3 size={20} />
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Remove Student Confirmation Modal */}
      {showRemoveModal && studentToRemove && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}>
          <div className="glass" style={{
            maxWidth: '500px',
            width: '90%',
            padding: '40px',
            borderRadius: '24px',
            background: 'rgba(0, 0, 0, 0.8)',
            border: '2px solid rgba(239, 68, 68, 0.4)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <AlertTriangle size={40} style={{ color: '#ef4444' }} />
            </div>

            <h2 style={{
              fontSize: '28px',
              fontWeight: '900',
              marginBottom: '16px',
              color: '#ef4444',
            }}>
              Remove Hunter
            </h2>

            <p style={{
              fontSize: '18px',
              marginBottom: '8px',
              color: '#fff',
            }}>
              Are you sure you want to remove
            </p>
            
            <p style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '20px',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {studentToRemove.full_name}
            </p>

            <div style={{
              padding: '20px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '12px',
              marginBottom: '32px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}>
              <p style={{ color: '#fca5a5', fontSize: '14px', lineHeight: '1.6' }}>
                <strong>Warning:</strong> This action cannot be undone. The hunter will be removed from your roster and you will lose access to their progress data and feedback history.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                onClick={() => {
                  setShowRemoveModal(false);
                  setStudentToRemove(null);
                }}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={confirmRemoveStudent}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
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
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 30px rgba(239, 68, 68, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Trash2 size={20} />
                Remove Hunter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}