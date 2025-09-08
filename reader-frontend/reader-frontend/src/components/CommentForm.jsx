import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CommentForm = ({ postId, parentId = null, onCommentAdded, onCancel, placeholder = "Write a comment..." }) => {
  const { user, isAuthenticated, API_BASE_URL, token } = useAuth();
  const [content, setContent] = useState('');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Comment content is required');
      return;
    }

    if (!isAuthenticated && !username.trim()) {
      setError('Username is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const body = {
        postId,
        content: content.trim(),
        username: username.trim(),
        ...(email && { email: email.trim() }),
        ...(parentId && { parentId }),
      };

      const response = await fetch(`${API_BASE_URL}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        onCommentAdded(data.data.comment);
        setContent('');
        if (!isAuthenticated) {
          setUsername('');
          setEmail('');
        }
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

  return (
    <form onSubmit={handleSubmit} className={parentId ? 'reply-form' : 'comment-form'}>
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {!isAuthenticated && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <input
              type="email"
              placeholder="Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </div>
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
      </div>
    </form>
  );
};

export default CommentForm;