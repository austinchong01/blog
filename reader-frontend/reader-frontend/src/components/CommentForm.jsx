import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const CommentForm = ({ postId, parentId = null, onCommentAdded, onCancel, placeholder = "Write a comment..." }) => {
  const { user, isAuthenticated, API_BASE_URL, token } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Comment content is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const requestBody = {
        postId,
        content: content.trim(),
      };

      // Only add parentId if it exists
      if (parentId) {
        requestBody.parentId = parentId;
      }

      const response = await fetch(`${API_BASE_URL}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        onCommentAdded(data.data.comment);
        setContent('');
        if (onCancel) onCancel(); // Close reply form
      } else {
        setError(data.message || 'Failed to post comment');
      }
    } catch (err) {
      setError('Network error while posting comment');
      console.error('Error posting comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // If user is not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className={parentId ? 'reply-form' : 'comment-form'}>
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            You must be logged in to post comments.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
            <Link to="/register" className="btn btn-outline">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={parentId ? 'reply-form' : 'comment-form'}>
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="form-group">
        <textarea
          placeholder={placeholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="form-textarea"
          rows={parentId ? 3 : 4}
          required
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary"
        >
          {submitting ? 'Posting...' : (parentId ? 'Reply' : 'Post Comment')}
        </button>
        
        {parentId && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        )}

        <span style={{ fontSize: '0.875rem', color: '#666' }}>
          Posting as <strong>{user.username}</strong>
        </span>
      </div>
    </form>
  );
};

export default CommentForm;