import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Comments = () => {
  const { API_BASE_URL, token, user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchComments();
  }, [currentPage]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 20,
      });

      const response = await fetch(`${API_BASE_URL}/comments?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setComments(data.data.comments);
        setTotalPages(data.data.pagination.pages);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch comments');
      }
    } catch (err) {
      setError('Network error while fetching comments');
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId, commentContent) => {
    const truncatedContent = commentContent.length > 50 
      ? commentContent.substring(0, 50) + '...' 
      : commentContent;
    
    if (!window.confirm(`Are you sure you want to delete this comment?\n\n"${truncatedContent}"`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete comment');
      }
    } catch (err) {
      alert('Network error while deleting comment');
      console.error('Error deleting comment:', err);
    }
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editContent.trim()) {
      alert('Comment content cannot be empty');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setComments(prevComments =>
          prevComments.map(comment =>
            comment.id === commentId
              ? { ...comment, content: editContent.trim(), updatedAt: new Date().toISOString() }
              : comment
          )
        );
        setEditingComment(null);
        setEditContent('');
      } else {
        alert(data.message || 'Failed to update comment');
      }
    } catch (err) {
      alert('Network error while updating comment');
      console.error('Error updating comment:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
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
        <h1>Comments Management</h1>
        <Link to="/dashboard" className="btn btn-outline">
          Back to Dashboard
        </Link>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="card">
          <div className="card-body text-center">
            <p>No comments found.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              {comments.map((comment, index) => (
                <div 
                  key={comment.id} 
                  style={{ 
                    padding: '1.5rem',
                    borderBottom: index < comments.length - 1 ? '1px solid #dee2e6' : 'none'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem',
                        marginBottom: '0.5rem'
                      }}>
                        <strong>{comment.user?.username || comment.username}</strong>
                        <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                          {formatDate(comment.createdAt)}
                          {comment.updatedAt !== comment.createdAt && ' (edited)'}
                        </span>
                      </div>
                      {comment.post && (
                        <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                          On: <Link 
                            to={`/posts/edit/${comment.post.id}`} 
                            style={{ color: '#007bff', textDecoration: 'none' }}
                          >
                            "{comment.post.title}"
                          </Link>
                        </div>
                      )}
                    </div>
                    
                    <div className="table-actions">
                      <button
                        onClick={() => handleEditComment(comment)}
                        className="btn btn-outline btn-sm"
                        disabled={editingComment === comment.id}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id, comment.content)}
                        className="btn btn-danger btn-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {editingComment === comment.id ? (
                    <div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="form-textarea"
                        rows={3}
                        style={{ marginBottom: '1rem' }}
                      />
                      <div className="d-flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(comment.id)}
                          className="btn btn-primary btn-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="btn btn-secondary btn-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      padding: '1rem',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px',
                      border: '1px solid #dee2e6'
                    }}>
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {comment.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
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

export default Comments;