import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NewPost = () => {
  const { API_BASE_URL, token } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    published: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
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
        navigate('/posts');
      } else {
        setError(data.message || 'Failed to create post');
      }
    } catch (err) {
      setError('Network error while creating post');
      console.error('Error creating post:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsDraft = async () => {
    setFormData(prev => ({ ...prev, published: false }));
    // The form submission will handle the rest
  };

  const handlePublish = async () => {
    setFormData(prev => ({ ...prev, published: true }));
    // The form submission will handle the rest
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>New Post</h1>
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
                disabled={loading}
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
                disabled={loading}
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
                  disabled={loading}
                />
                <label htmlFor="published" className="form-label">
                  Publish immediately
                </label>
              </div>
              <small style={{ color: '#6c757d' }}>
                If unchecked, the post will be saved as a draft.
              </small>
            </div>
          </div>

          <div className="card-footer">
            <div className="d-flex gap-2 justify-content-between">
              <div className="d-flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Saving...' : (formData.published ? 'Publish Post' : 'Save as Draft')}
                </button>
                
                {!formData.published && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, published: true }));
                      // Will be handled by form submission
                    }}
                    disabled={loading}
                    className="btn btn-success"
                  >
                    Publish Now
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate('/posts')}
                className="btn btn-secondary"
                disabled={loading}
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

export default NewPost;