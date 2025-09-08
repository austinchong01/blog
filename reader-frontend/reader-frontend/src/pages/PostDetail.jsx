import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CommentSection from '../components/CommentSection';

const PostDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { API_BASE_URL, token } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/posts/${slug}`, {
        headers,
      });

      const data = await response.json();

      if (response.ok) {
        setPost(data.data.post);
        setError(null);
      } else {
        if (response.status === 404) {
          setError('Post not found');
        } else {
          setError(data.message || 'Failed to fetch post');
        }
      }
    } catch (err) {
      setError('Network error while fetching post');
      console.error('Error fetching post:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatContent = (content) => {
    // Simple text formatting - split by paragraphs
    return content.split('\n\n').map((paragraph, index) => (
      <p key={index}>{paragraph}</p>
    ));
  };

  if (loading) {
    return <div className="loading">Loading post...</div>;
  }

  if (error) {
    return (
      <div className="alert alert-error">
        {error}
        <br />
        <button onClick={() => navigate('/')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Home
        </button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="alert alert-error">
        Post not found
        <br />
        <button onClick={() => navigate('/')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="post-detail">
      <article>
        <header className="post-header">
          <h1 className="post-detail-title">{post.title}</h1>
          <div className="post-detail-meta">
            <span>By <strong>{post.author.username}</strong></span>
            <span> • </span>
            <span>{formatDate(post.publishedAt || post.createdAt)}</span>
            {!post.published && (
              <>
                <span> • </span>
                <span className="draft-badge" style={{ 
                  background: '#ffc107', 
                  color: '#000', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '4px',
                  fontSize: '0.75rem'
                }}>
                  DRAFT
                </span>
              </>
            )}
          </div>
        </header>

        <div className="post-content">
          {formatContent(post.content)}
        </div>
      </article>

      <CommentSection postId={post.id} comments={post.comments} />
    </div>
  );
};

export default PostDetail;