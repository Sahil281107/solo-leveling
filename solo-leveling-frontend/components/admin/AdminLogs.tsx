'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Clock, Activity, ChevronLeft, ChevronRight, Zap, Eye, Trash, Edit, Plus } from 'lucide-react';

export default function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [currentPage]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/logs', {
        params: { page: currentPage, limit: 20 }
      });
      setLogs(response.data.logs || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('DELETE')) return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
    if (action.includes('CREATE')) return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
    if (action.includes('UPDATE')) return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
    if (action.includes('VIEW')) return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
    return { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280', border: 'rgba(107, 114, 128, 0.3)' };
  };

  const getActionIcon = (action: string) => {
    if (action.includes('DELETE')) return Trash;
    if (action.includes('CREATE')) return Plus;
    if (action.includes('UPDATE')) return Edit;
    if (action.includes('VIEW')) return Eye;
    return Activity;
  };

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      border: '1px solid rgba(147, 51, 234, 0.2)',
      padding: '24px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <Activity style={{ width: '24px', height: '24px', color: '#a855f7' }} />
        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#fff',
          fontFamily: 'Orbitron, monospace'
        }}>
          Admin Activity Logs
        </h2>
        <div style={{
          marginLeft: 'auto',
          background: 'rgba(147, 51, 234, 0.2)',
          padding: '4px 12px',
          borderRadius: '20px',
          border: '1px solid rgba(147, 51, 234, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Zap style={{ width: '14px', height: '14px', color: '#a855f7' }} />
          <span style={{ fontSize: '12px', color: '#a855f7', fontWeight: '600' }}>
            REAL-TIME
          </span>
        </div>
      </div>

      {/* Logs List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(147, 51, 234, 0.3)',
            borderTopColor: '#9333ea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#9ca3af', fontSize: '16px' }}>Loading activity logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Activity style={{ width: '48px', height: '48px', color: '#6b7280', margin: '0 auto 16px' }} />
          <p style={{ color: '#9ca3af', fontSize: '16px' }}>No activity logs found</p>
        </div>
      ) : (
        <div style={{ marginBottom: '20px' }}>
          {logs.map((log, index) => {
            const actionColors = getActionColor(log.action_type);
            const ActionIcon = getActionIcon(log.action_type);
            
            return (
              <div
                key={log.log_id}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(147, 51, 234, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.3)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
                  e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.1)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                {/* Left Border Indicator */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  background: actionColors.text,
                  borderRadius: '12px 0 0 12px'
                }} />

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  paddingLeft: '12px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        background: actionColors.bg,
                        border: `1px solid ${actionColors.border}`,
                        borderRadius: '8px',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <ActionIcon style={{ width: '16px', height: '16px', color: actionColors.text }} />
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap'
                        }}>
                          <span style={{
                            fontSize: '15px',
                            fontWeight: '700',
                            color: actionColors.text,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {log.action_type.replace(/_/g, ' ')}
                          </span>
                          <span style={{ color: '#6b7280', fontSize: '13px' }}>by</span>
                          <span style={{
                            fontSize: '14px',
                            color: '#a855f7',
                            fontWeight: '600',
                            background: 'rgba(147, 51, 234, 0.1)',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>
                            {log.admin_username || 'Admin'}
                          </span>
                        </div>

                        {log.action_details && (
                          <p style={{
                            fontSize: '13px',
                            color: '#9ca3af',
                            marginTop: '6px',
                            maxWidth: '600px',
                            lineHeight: '1.5'
                          }}>
                            {typeof log.action_details === 'string' 
                              ? log.action_details 
                              : JSON.stringify(log.action_details)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    whiteSpace: 'nowrap'
                  }}>
                    <Clock style={{ width: '14px', height: '14px', color: '#6b7280' }} />
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {new Date(log.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
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
            onMouseEnter={(e) => {
              if (currentPage !== 1) {
                e.currentTarget.style.background = 'rgba(147, 51, 234, 0.3)';
                e.currentTarget.style.transform = 'translateX(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(147, 51, 234, 0.2)';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <ChevronLeft style={{ width: '16px', height: '16px' }} />
            Previous
          </button>

          <div style={{
            padding: '8px 16px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(147, 51, 234, 0.2)',
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
            onMouseEnter={(e) => {
              if (currentPage !== totalPages) {
                e.currentTarget.style.background = 'rgba(147, 51, 234, 0.3)';
                e.currentTarget.style.transform = 'translateX(2px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(147, 51, 234, 0.2)';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            Next
            <ChevronRight style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
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