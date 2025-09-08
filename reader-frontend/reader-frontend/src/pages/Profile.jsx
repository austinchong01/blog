import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user, token, API_BASE_URL, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUserStats();
  }, [user, navigate]);

  const fetchUserStats = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users/${user.id}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStats(data.data);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch user stats');
      }
    } catch (err) {
      setError('Network error while fetching user stats');
      console.error('Error fetching user stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN': return '#dc3545';
      case 'AUTHOR': return '#28a745';
      case 'USER': return '#6c757d';
      default: return '#6c757d';
    }
  };

  if (!user) {
    return <div className="loading">Redirecting to login...</div>;
  }

  return (
    <div className="profile-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="card">
        <div className="card-header">
          <h1>Profile</h1>
        </div>
        <div className="card-body">
          <div className="profile-info" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <h2>{user.username}</h2>
              <span 
                style={{
                  background: getRoleBadgeColor(user.role),
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}
              >
                {user.role}
              </span>
            </div>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Member since:</strong> {formatDate(user.createdAt)}</p>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {loading ? (
            <div className="loading">Loading statistics...</div>
          ) : stats && (
            <div className="stats-section">
              <h3 style={{ marginBottom: '1rem' }}>Statistics</h3>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <div className="stat-card" style={{ 
                  background: '#f8f9fa', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
                    {stats.stats.totalPosts}
                  </div>
                  <div>Total Posts</div>
                </div>
                
                <div className="stat-card" style={{ 
                  background: '#f8f9fa', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
                    {stats.stats.publishedPosts}
                  </div>
                  <div>Published Posts</div>
                </div>
                
                <div className="stat-card" style={{ 
                  background: '#f8f9fa', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>
                    {stats.stats.draftPosts}
                  </div>
                  <div>Draft Posts</div>
                </div>
                
                <div className="stat-card" style={{ 
                  background: '#f8f9fa', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#17a2b8' }}>
                    {stats.stats.totalComments}
                  </div>
                  <div>Comments Made</div>
                </div>
              </div>

              {stats.recentPosts && stats.recentPosts.length > 0 && (
                <div className="recent-posts-section">
                  <h3 style={{ marginBottom: '1rem' }}>Recent Posts</h3>
                  <div className="recent-posts-list">
                    {stats.recentPosts.map(post => (
                      <div key={post.id} className="recent-post-item" style={{
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '0.5rem',
                        background: 'white'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
                              {post.title}
                            </h4>
                            <div style={{ fontSize: '0.875rem', color: '#666' }}>
                              <span>Created: {formatDate(post.createdAt)}</span>
                              {post._count?.comments > 0 && (
                                <span> • {post._count.comments} comment{post._count.comments !== 1 ? 's' : ''}</span>
                              )}
                            </div>
                          </div>
                          <span style={{
                            background: post.published ? '#28a745' : '#ffc107',
                            color: post.published ? 'white' : '#000',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}>
                            {post.published ? 'Published' : 'Draft'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="profile-actions" style={{ 
            marginTop: '2rem', 
            paddingTop: '2rem', 
            borderTop: '1px solid #dee2e6' 
          }}>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="btn btn-secondary"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;