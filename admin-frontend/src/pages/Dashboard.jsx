import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { API_BASE_URL, token, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [recentComments, setRecentComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user stats
      const statsResponse = await fetch(`${API_BASE_URL}/users/${user.id}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data.stats);
        setRecentPosts(statsData.data.recentPosts || []);
      }

      // Fetch recent comments (for admins)
      if (user.role === 'ADMIN') {
        const commentsResponse = await fetch(`${API_BASE_URL}/comments?limit=5`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json();
          setRecentComments(commentsData.data.comments || []);
        }
      }

      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Dashboard</h1>
        <Link to="/posts/new" className="btn btn-primary">
          New Post
        </Link>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#007bff' }}>
              {stats.totalPosts}
            </div>
            <div className="stat-label">Total Posts</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#28a745' }}>
              {stats.publishedPosts}
            </div>
            <div className="stat-label">Published</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#ffc107' }}>
              {stats.draftPosts}
            </div>
            <div className="stat-label">Drafts</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#17a2b8' }}>
              {stats.totalComments}
            </div>
            <div className="stat-label">Comments Made</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: user.role === 'ADMIN' ? '1fr 1fr' : '1fr', gap: '2rem' }}>
        {/* Recent Posts */}
        <div className="card">
          <div className="card-header">
            <h3 className="mb-0">Recent Posts</h3>
            <Link to="/posts" className="btn btn-outline btn-sm">
              View All
            </Link>
          </div>
          <div className="card-body">
            {recentPosts.length === 0 ? (
              <p className="text-center" style={{ color: '#6c757d' }}>
                No posts yet. <Link to="/posts/new">Create your first post</Link>
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recentPosts.map(post => (
                  <div key={post.id} style={{ 
                    padding: '1rem', 
                    border: '1px solid #dee2e6', 
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h5 style={{ margin: '0 0 0.5rem 0' }}>
                        <Link 
                          to={`/posts/edit/${post.id}`}
                          style={{ textDecoration: 'none', color: '#007bff' }}
                        >
                          {post.title}
                        </Link>
                      </h5>
                      <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                        Created: {formatDate(post.createdAt)}
                        {post._count?.comments > 0 && (
                          <span> • {post._count.comments} comment{post._count.comments !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                    <span className={`status-badge ${post.published ? 'status-published' : 'status-draft'}`}>
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Comments (Admin only) */}
        {user.role === 'ADMIN' && (
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">Recent Comments</h3>
              <Link to="/comments" className="btn btn-outline btn-sm">
                Manage All
              </Link>
            </div>
            <div className="card-body">
              {recentComments.length === 0 ? (
                <p className="text-center" style={{ color: '#6c757d' }}>
                  No recent comments
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {recentComments.map(comment => (
                    <div key={comment.id} style={{ 
                      padding: '1rem', 
                      border: '1px solid #dee2e6', 
                      borderRadius: '4px'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: '0.5rem',
                        fontSize: '0.875rem',
                        color: '#6c757d'
                      }}>
                        <span>
                          <strong>{comment.user?.username || comment.username}</strong> 
                          {comment.post && (
                            <span> on "{comment.post.title}"</span>
                          )}
                        </span>
                        <span>{formatDate(comment.createdAt)}</span>
                      </div>
                      <p style={{ margin: 0, color: '#495057' }}>
                        {comment.content.length > 100 
                          ? `${comment.content.substring(0, 100)}...` 
                          : comment.content
                        }
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;