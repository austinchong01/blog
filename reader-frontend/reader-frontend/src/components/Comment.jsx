import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CommentForm from './CommentForm';

const Comment = ({ comment, postId, onCommentAdded, onCommentUpdated, onCommentDeleted }) => {
  const { user, isAuthenticated, API_BASE_URL, token } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canEdit = isAuthenticated && user && (
    user.role === 'ADMIN' || 
    (comment.userId && comment.userId === user.id)
  );

  const canDelete = canEdit;

  const handleEdit = async (e) => {
    e.preventDefault();
    
    if (!editContent.trim()) {
      setError('Comment content is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/comments/${comment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editContent.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        onCommentUpdated(data.data.comment);
        setIsEditing(false);
      } else {
        setError(data.message || 'Failed to update comment');
      }
    } catch (err) {
      setError('Network error while updating comment');
      console.error('Error updating comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/comments/${comment.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        onCommentDeleted(comment);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete comment');
      }
    } catch (err) {
      alert('Network error while deleting comment');
      console.error('Error deleting comment:', err);
    }
  };

  return (
    <div className="comment">
      <div className="comment-header">
        <span className="comment-author">
          {comment.user?.username || comment.username}
        </span>
        <span className="comment-date">
          {formatDate(comment.createdAt)}
          {comment.updatedAt !== comment.createdAt && ' (edited)'}
        </span>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleEdit}>
          <div className="form-group">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="form-textarea"
              rows={3}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditContent(comment.content);
                setError(null);
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="comment-content">
            {comment.content}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="btn btn-outline"
              style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
            >
              Reply
            </button>

            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-outline"
                style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
              >
                Edit
              </button>
            )}

            {canDelete && (
              <button
                onClick={handleDelete}
                className="btn btn-outline"
                style={{ 
                  fontSize: '0.875rem', 
                  padding: '0.25rem 0.5rem',
                  color: '#dc3545',
                  borderColor: '#dc3545'
                }}
              >
                Delete
              </button>
            )}
          </div>
        </>
      )}

      {showReplyForm && (
        <CommentForm
          postId={postId}
          parentId={comment.id}
          onCommentAdded={onCommentAdded}
          onCancel={() => setShowReplyForm(false)}
          placeholder={`Reply to ${comment.user?.username || comment.username}...`}
        />
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map(reply => (
            <Comment
              key={reply.id}
              comment={reply}
              postId={postId}
              onCommentAdded={onCommentAdded}
              onCommentUpdated={onCommentUpdated}
              onCommentDeleted={onCommentDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Comment;