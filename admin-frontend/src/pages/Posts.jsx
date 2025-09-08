import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Posts = () => {
  const { API_BASE_URL, token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchPosts();
  }, [currentPage, statusFilter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(`${API_BASE_URL}/posts/all?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setPosts(data.data.posts);
        setTotalPages(data.data.pagination.pages);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch posts');
      }
    } catch (err) {
      setError('Network error while fetching posts');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToggle = async (postId, currentPublishedStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          published: !currentPublishedStatus,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the post in the local state
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId
              ? { ...post, published: !currentPublishedStatus }
              : post
          )
        );
      } else {
        alert(data.message || 'Failed to update post');
      }
    } catch (err) {
      alert('Network error while updating post');
      console.error('Error updating post:', err);
    }
  };

  const handleDeletePost = async (postId, postTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${postTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove the post from local state
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete post');
      }
    } catch (err) {
      alert('Network error while deleting post');
      console.error('Error deleting post:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Posts</h1>
        <Link to="/posts/new" className="btn btn-primary">
          New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="d-flex gap-2 align-items-center">
            <label htmlFor="statusFilter" className="form-label mb-0">
              Filter by status:
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="form-select"
              style={{ width: 'auto' }}
            >
              <option value="all">All Posts</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="card">
          <div className="card-body text-center">
            <p>No posts found.</p>
            <Link to="/posts/new" className="btn btn-primary">
              Create Your First Post
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Comments</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <Link 
                        to={`/posts/edit/${post.id}`}
                        style={{ textDecoration: 'none', color: '#007bff', fontWeight: 500 }}
                      >
                        {post.title}
                      </Link>
                    </td>
                    <td>{post.author.username}</td>
                    <td>
                      <span className={`status-badge ${post.published ? 'status-published' : 'status-draft'}`}>
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td>{post._count?.comments || 0}</td>
                    <td>{formatDate(post.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <Link 
                          to={`/posts/edit/${post.id}`}
                          className="btn btn-outline btn-sm"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handlePublishToggle(post.id, post.published)}
                          className={`btn btn-sm ${post.published ? 'btn-warning' : 'btn-success'}`}
                        >
                          {post.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id, post.title)}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="pagination-btn"
              >
                Previous
              </button>
              
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || loading}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Posts;