'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  X, Search, Filter, Target, CheckCircle, Clock, 
  ChevronLeft, ChevronRight, Zap, Trophy, Star,
  Calendar, User
} from 'lucide-react';

interface QuestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuestManagementModal({ isOpen, onClose }: QuestModalProps) {
  const [quests, setQuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, completed
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (isOpen) {
      fetchQuests();
    }
  }, [isOpen, currentPage, filterStatus]);

  const fetchQuests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/quests', {
        params: {
          page: currentPage,
          limit: 15,
          status: filterStatus === 'all' ? undefined : filterStatus
        }
      });
      setQuests(response.data.quests || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to fetch quests:', error);
      toast.error('Failed to load quests');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty?.toLowerCase()) {
      case 'easy': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'medium': return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
      case 'hard': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      default: return { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280', border: 'rgba(107, 114, 128, 0.3)' };
    }
  };

  const getStatusColor = (isCompleted: boolean) => {
    if (isCompleted) {
      return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)', icon: CheckCircle };
    }
    return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)', icon: Clock };
  };

  const filteredQuests = quests.filter(quest => 
    quest.quest_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quest.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.95)',
        border: '1px solid rgba(147, 51, 234, 0.3)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
        animation: 'slideUp 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2))',
          borderBottom: '1px solid rgba(147, 51, 234, 0.3)',
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #9333ea, #ec4899)',
              padding: '10px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(147, 51, 234, 0.5)'
            }}>
              <Target style={{ width: '24px', height: '24px', color: '#fff' }} />
            </div>
            <div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#fff',
                fontFamily: 'Orbitron, monospace'
              }}>
                Quest Management
              </h2>
              <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                View and manage all system quests
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '10px',
              color: '#ef4444',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          maxHeight: 'calc(90vh - 150px)'
        }}>
          {/* Search and Filter */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              flex: 1,
              minWidth: '250px',
              position: 'relative'
            }}>
              <Search style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '18px',
                height: '18px',
                color: '#9ca3af'
              }} />
              <input
                type="text"
                placeholder="Search quests or users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(147, 51, 234, 0.2)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#9333ea';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(147, 51, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {['all', 'active', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilterStatus(status);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '10px 20px',
                    background: filterStatus === status ? 'linear-gradient(135deg, #9333ea, #ec4899)' : 'rgba(0, 0, 0, 0.4)',
                    border: filterStatus === status ? '1px solid rgba(147, 51, 234, 0.5)' : '1px solid rgba(147, 51, 234, 0.2)',
                    borderRadius: '10px',
                    color: filterStatus === status ? '#fff' : '#9ca3af',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    transition: 'all 0.3s ease',
                    boxShadow: filterStatus === status ? '0 4px 15px rgba(147, 51, 234, 0.3)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (filterStatus !== status) {
                      e.currentTarget.style.background = 'rgba(147, 51, 234, 0.2)';
                      e.currentTarget.style.color = '#fff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filterStatus !== status) {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
                      e.currentTarget.style.color = '#9ca3af';
                    }
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Quest List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{
                width: '48px',
                height: '48px',
                border: '4px solid rgba(147, 51, 234, 0.3)',
                borderTopColor: '#9333ea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }} />
              <p style={{ color: '#9ca3af', fontSize: '16px' }}>Loading quests...</p>
            </div>
          ) : filteredQuests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Target style={{ width: '48px', height: '48px', color: '#6b7280', margin: '0 auto 16px' }} />
              <p style={{ color: '#9ca3af', fontSize: '16px' }}>No quests found</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {filteredQuests.map((quest, index) => {
                const difficultyColors = getDifficultyColor(quest.difficulty);
                const statusColors = getStatusColor(quest.is_completed);
                const StatusIcon = statusColors.icon;
                
                return (
                  <div
                    key={quest.active_quest_id || index}
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(147, 51, 234, 0.2)',
                      borderRadius: '12px',
                      padding: '20px',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.4)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
                      e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.2)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    {/* Status Indicator Bar */}
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      background: statusColors.text,
                      borderRadius: '12px 0 0 12px'
                    }} />

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '16px',
                      paddingLeft: '12px'
                    }}>
                      <div style={{ flex: 1 }}>
                        {/* Quest Title & User */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '12px',
                          flexWrap: 'wrap'
                        }}>
                          <h3 style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            color: '#fff',
                            margin: 0
                          }}>
                            {quest.quest_title || 'Untitled Quest'}
                          </h3>
                          
                          {quest.username && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              background: 'rgba(147, 51, 234, 0.1)',
                              border: '1px solid rgba(147, 51, 234, 0.3)',
                              borderRadius: '6px'
                            }}>
                              <User style={{ width: '14px', height: '14px', color: '#a855f7' }} />
                              <span style={{ fontSize: '13px', color: '#a855f7', fontWeight: '600' }}>
                                {quest.username}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Quest Description */}
                        {quest.quest_description && (
                          <p style={{
                            fontSize: '14px',
                            color: '#9ca3af',
                            marginBottom: '12px',
                            lineHeight: '1.5'
                          }}>
                            {quest.quest_description}
                          </p>
                        )}

                        {/* Quest Details */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          flexWrap: 'wrap'
                        }}>
                          {/* Difficulty Badge */}
                          <div style={{
                            padding: '4px 12px',
                            background: difficultyColors.bg,
                            border: `1px solid ${difficultyColors.border}`,
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <Star style={{ width: '14px', height: '14px', color: difficultyColors.text }} />
                            <span style={{
                              fontSize: '13px',
                              color: difficultyColors.text,
                              fontWeight: '600',
                              textTransform: 'uppercase'
                            }}>
                              {quest.difficulty || 'N/A'}
                            </span>
                          </div>

                          {/* XP Badge */}
                          {quest.base_xp && (
                            <div style={{
                              padding: '4px 12px',
                              background: 'rgba(245, 158, 11, 0.1)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <Zap style={{ width: '14px', height: '14px', color: '#f59e0b' }} />
                              <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: '600' }}>
                                {quest.base_xp} XP
                              </span>
                            </div>
                          )}

                          {/* Completion Date */}
                          {quest.completed_at && (
                            <div style={{
                              padding: '4px 12px',
                              background: 'rgba(107, 114, 128, 0.1)',
                              border: '1px solid rgba(107, 114, 128, 0.3)',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <Calendar style={{ width: '14px', height: '14px', color: '#6b7280' }} />
                              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                                {new Date(quest.completed_at).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div style={{
                        padding: '8px 16px',
                        background: statusColors.bg,
                        border: `1px solid ${statusColors.border}`,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexShrink: 0
                      }}>
                        <StatusIcon style={{ width: '18px', height: '18px', color: statusColors.text }} />
                        <span style={{
                          fontSize: '14px',
                          color: statusColors.text,
                          fontWeight: '700',
                          textTransform: 'uppercase'
                        }}>
                          {quest.is_completed ? 'Completed' : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(147, 51, 234, 0.2)'
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(147, 51, 234, 0.2)',
                  border: '1px solid rgba(147, 51, 234, 0.3)',
                  borderRadius: '8px',
                  color: '#a855f7',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}
              >
                <ChevronLeft style={{ width: '16px', height: '16px' }} />
                Previous
              </button>

              <div style={{
                padding: '8px 16px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(147, 51, 234, 0.3)',
                borderRadius: '8px'
              }}>
                <span style={{ color: '#a855f7', fontWeight: '600', fontSize: '14px' }}>
                  Page {currentPage}
                </span>
                <span style={{ color: '#6b7280', margin: '0 6px' }}>/</span>
                <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                  {totalPages}
                </span>
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(147, 51, 234, 0.2)',
                  border: '1px solid rgba(147, 51, 234, 0.3)',
                  borderRadius: '8px',
                  color: '#a855f7',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}
              >
                Next
                <ChevronRight style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}