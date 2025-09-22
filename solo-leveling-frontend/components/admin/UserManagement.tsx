'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  Search, Filter, Trash2, Eye, Power,
  ChevronLeft, ChevronRight, User, Crown, Shield, Sword
} from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, filterType]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users', {
        params: {
          page: currentPage,
          limit: 10,
          user_type: filterType === 'all' ? undefined : filterType
        }
      });
      setUsers(response.data.users || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: number) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-status`);
      toast.success('User status updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await api.delete(`/admin/users/${userToDelete.user_id}`);
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const getUserTypeIcon = (type: string) => {
    switch(type) {
      case 'admin': return Crown;
      case 'coach': return Shield;
      case 'adventurer': return Sword;
      default: return User;
    }
  };

  const getUserTypeColor = (type: string) => {
    switch(type) {
      case 'admin': return { bg: 'rgba(236, 72, 153, 0.1)', text: '#ec4899', border: 'rgba(236, 72, 153, 0.3)' };
      case 'coach': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'adventurer': return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
      default: return { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280', border: 'rgba(107, 114, 128, 0.3)' };
    }
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <User style={{ width: '24px', height: '24px', color: '#a855f7' }} />
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#fff',
            fontFamily: 'Orbitron, monospace'
          }}>
            User Management
          </h2>
        </div>
      </div>

      {/* Search and Filter */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
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
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(147, 51, 234, 0.2)',
              borderRadius: '8px',
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
          {['all', 'adventurer', 'coach', 'admin'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: '10px 20px',
                background: filterType === type ? 'rgba(147, 51, 234, 0.2)' : 'rgba(0, 0, 0, 0.3)',
                border: filterType === type ? '1px solid rgba(147, 51, 234, 0.5)' : '1px solid rgba(147, 51, 234, 0.2)',
                borderRadius: '8px',
                color: filterType === type ? '#a855f7' : '#9ca3af',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                textTransform: 'capitalize',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (filterType !== type) {
                  e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (filterType !== type) {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
                  e.currentTarget.style.color = '#9ca3af';
                }
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Users List */}
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
          <p style={{ color: '#9ca3af' }}>Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <User style={{ width: '48px', height: '48px', color: '#6b7280', margin: '0 auto 16px' }} />
          <p style={{ color: '#9ca3af' }}>No users found</p>
        </div>
      ) : (
        <div style={{ marginBottom: '20px' }}>
          {filteredUsers.map((user) => {
            const TypeIcon = getUserTypeIcon(user.user_type);
            const typeColors = getUserTypeColor(user.user_type);
            
            return (
              <div
                key={user.user_id}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(147, 51, 234, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <div style={{
                    background: typeColors.bg,
                    border: `1px solid ${typeColors.border}`,
                    borderRadius: '10px',
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <TypeIcon style={{ width: '20px', height: '20px', color: typeColors.text }} />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <p style={{ fontSize: '16px', fontWeight: '600', color: '#fff' }}>
                        {user.username}
                      </p>
                      <span style={{
                        padding: '2px 8px',
                        background: typeColors.bg,
                        border: `1px solid ${typeColors.border}`,
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: typeColors.text,
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {user.user_type}
                      </span>
                    </div>
                    <p style={{ fontSize: '14px', color: '#9ca3af' }}>{user.email}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleToggleStatus(user.user_id)}
                    style={{
                      padding: '8px',
                      background: user.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: user.is_active ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      color: user.is_active ? '#10b981' : '#ef4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title={user.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <Power style={{ width: '16px', height: '16px' }} />
                  </button>

                  <button
                    onClick={() => {
                      setUserToDelete(user);
                      setShowDeleteModal(true);
                    }}
                    style={{
                      padding: '8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title="Delete User"
                  >
                    <Trash2 style={{ width: '16px', height: '16px' }} />
                  </button>
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
          marginTop: '24px'
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
              transition: 'all 0.3s ease'
            }}
          >
            <ChevronLeft style={{ width: '16px', height: '16px' }} />
            Previous
          </button>

          <span style={{ color: '#9ca3af', fontSize: '14px' }}>
            Page {currentPage} of {totalPages}
          </span>

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
              transition: 'all 0.3s ease'
            }}
          >
            Next
            <ChevronRight style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            width: '100%'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>
              Delete User
            </h3>
            <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
              Are you sure you want to delete <strong style={{ color: '#fff' }}>{userToDelete?.username}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'rgba(107, 114, 128, 0.2)',
                  border: '1px solid rgba(107, 114, 128, 0.3)',
                  borderRadius: '8px',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}