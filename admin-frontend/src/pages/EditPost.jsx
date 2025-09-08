import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const EditPost = () => {
  const { id } = useParams();
  const { API_BASE_URL, token } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    published: false,
  });
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/posts/all?page=1&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        const post = data.data.posts.find(p => p.id === id);
        if (post) {
          const postData = {
            title: post.title,
            content: post.content,
            published: post.published,
          };
          setFormData(postData);
          setOriginalData(postData);
          setError(null);
        } else {
          setError('Post not found');
        }
      } else {
        setError(data.message || 'Failed to fetch post');
      }
    } catch (err) {
      setError('Network error while fetching post');
      console.error('Error fetching post:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content.trim(),
          published: formData.published,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setOriginalData(formData);
        navigate('/posts');
      } else {
        setError(data.message || 'Failed to update post');
      }
    } catch (err) {
      setError('Network error while updating post');
      console.error('Error updating post:', err);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = originalData && (
    formData.title !== originalData.title ||
    formData.content !== originalData.content ||
    formData.published !== originalData.published
  );

  if (loading) {
    return <div className="loading">Loading post...</div>;
  }

  if (error && !originalData) {
    return (
      <div className="alert alert-error">
        {error}
        <br />
        <button onClick={() => navigate('/posts')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Posts
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Edit Post</h1>
        <button 
          type="button"
          onClick={() => navigate('/posts')}
          className="btn btn-outline"
        >
          Back to Posts
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {hasChanges && (
        <div className="alert alert-warning">
          You have unsaved changes.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-body">
            <div className="form-group">
              <label htmlFor="title" className="form-label">
                Post Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter post title..."
                required
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="content" className="form-label">
                Content *
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                className="form-textarea"
                rows={15}
                placeholder="Write your post content here..."
                required
                disabled={saving}
              />
              <small style={{ color: '#6c757d' }}>
                Use double line breaks (press Enter twice) to create new paragraphs.
              </small>
            </div>

            <div className="form-group">
              <div className="form-check">
                <input
                  type="checkbox"
                  id="published"
                  name="published"
                  checked={formData.published}
                  onChange={handleChange}
                  className="form-check-input"
                  disabled={saving}
                />
                <label htmlFor="published" className="form-label">
                  Published
                </label>
              </div>
              <small style={{ color: '#6c757d' }}>
                {formData.published ? 'This post is publicly visible.' : 'This post is saved as a draft.'}
              </small>
            </div>
          </div>

          <div className="card-footer">
            <div className="d-flex gap-2 justify-content-between">
              <div className="d-flex gap-2">
                <button
                  type="submit"
                  disabled={saving || !hasChanges}
                  className="btn btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                
                {!formData.published && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, published: true }));
                    }}
                    disabled={saving}
                    className="btn btn-success"
                  >
                    Publish Now
                  </button>
                )}

                {formData.published && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, published: false }));
                    }}
                    disabled={saving}
                    className="btn btn-warning"
                  >
                    Unpublish
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate('/posts')}
                className="btn btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Preview Card */}
      {(formData.title || formData.content) && (
        <div className="card mt-3">
          <div className="card-header">
            <h3 className="mb-0">Preview</h3>
          </div>
          <div className="card-body">
            {formData.title && (
              <h2 style={{ marginBottom: '1rem', color: '#333' }}>
                {formData.title}
              </h2>
            )}
            {formData.content && (
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {formData.content.split('\n\n').map((paragraph, index) => (
                  <p key={index} style={{ marginBottom: '1rem' }}>
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditPost;