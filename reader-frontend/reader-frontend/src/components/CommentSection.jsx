import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CommentForm from './CommentForm';
import Comment from './Comment';

const CommentSection = ({ postId, comments: initialComments }) => {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState(initialComments || []);

  const handleCommentAdded = (newComment) => {
    if (newComment.parentId) {
      // This is a reply - update the parent comment's replies
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === newComment.parentId
            ? { ...comment, replies: [...(comment.replies || []), newComment] }
            : comment
        )
      );
    } else {
      // This is a top-level comment
      setComments(prevComments => [newComment, ...prevComments]);
    }
  };

  const handleCommentUpdated = (updatedComment) => {
    if (updatedComment.parentId) {
      // This is a reply update
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === updatedComment.parentId
            ? {
                ...comment,
                replies: comment.replies.map(reply =>
                  reply.id === updatedComment.id ? updatedComment : reply
                )
              }
            : comment
        )
      );
    } else {
      // This is a top-level comment update
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === updatedComment.id ? updatedComment : comment
        )
      );
    }
  };

  const handleCommentDeleted = (deletedComment) => {
    if (deletedComment.parentId) {
      // Remove reply
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === deletedComment.parentId
            ? {
                ...comment,
                replies: comment.replies.filter(reply => reply.id !== deletedComment.id)
              }
            : comment
        )
      );
    } else {
      // Remove top-level comment
      setComments(prevComments => 
        prevComments.filter(comment => comment.id !== deletedComment.id)
      );
    }
  };

  const totalComments = comments.reduce((total, comment) => total + 1 + (comment.replies?.length || 0), 0);

  return (
    <div className="comments-section">
      <h3 className="comments-title">
        Comments ({totalComments})
      </h3>

      {/* Always show the comment form - it will handle auth internally */}
      <CommentForm 
        postId={postId} 
        onCommentAdded={handleCommentAdded}
        placeholder="Write a comment..."
      />

      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="no-comments">
            {isAuthenticated 
              ? "No comments yet. Be the first to comment!" 
              : "No comments yet."}
          </div>
        ) : (
          comments.map(comment => (
            <Comment
              key={comment.id}
              comment={comment}
              postId={postId}
              onCommentAdded={handleCommentAdded}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;