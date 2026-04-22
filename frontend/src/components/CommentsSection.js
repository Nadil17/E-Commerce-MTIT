import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { commentAPI } from '../services/api';
import { useApp } from '../App';
import './CommentsSection.css';

export default function CommentsSection({ productId, productName }) {
  const { user } = useApp();
  const [comments, setComments] = useState([]);
  const [stats, setStats] = useState({ avg_rating: 0, total_ratings: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [productId]);

  const loadComments = async () => {
    try {
      const res = await commentAPI.getByProduct(productId);
      setComments(res.data.data.comments || []);
      setStats(res.data.data.stats || { avg_rating: 0, total_ratings: 0 });
    } catch (err) {
      console.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please sign in to add a review'); return; }
    if (!form.rating) { toast.error('Please select a rating'); return; }

    setSubmitting(true);
    try {
      await commentAPI.create({
        product_id: productId,
        user_id: user.id,
        user_name: user.name,
        rating: parseInt(form.rating),
        comment: form.comment
      });
      toast.success('Review posted!');
      setForm({ rating: 5, comment: '' });
      setShowForm(false);
      loadComments();
    } catch (err) {
      toast.error('Failed to post review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await commentAPI.delete(commentId);
      toast.success('Review deleted');
      loadComments();
    } catch (err) {
      toast.error('Failed to delete review');
    }
  };

  const avgRating = Number(stats?.avg_rating) || 0;
  const totalRatings = Number(stats?.total_ratings) || 0;

  const renderStars = (rating, interactive = false, onChange = null) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map(i => (
          <span
            key={i}
            className={`star ${i <= rating ? 'filled' : ''}`}
            onClick={() => interactive && onChange && onChange(i)}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="comments-section">
      <div className="comments-header">
        <h2>Customer Reviews</h2>
        <div className="rating-summary">
          {totalRatings > 0 && (
            <>
              {renderStars(Math.round(avgRating))}
              <span className="rating-text">
                {avgRating.toFixed(1)} ({totalRatings} review{totalRatings !== 1 ? 's' : ''})
              </span>
            </>
          )}
          {totalRatings === 0 && <p className="no-reviews">No reviews yet</p>}
        </div>
        {user && !showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>Write a Review</button>
        )}
      </div>

      {showForm && (
        <form className="review-form" onSubmit={handleSubmit}>
          <h3>Add Your Review</h3>
          <div className="form-group">
            <label>Rating</label>
            {renderStars(form.rating, true, (val) => setForm(f => ({ ...f, rating: val })))}
          </div>
          <div className="form-group">
            <label>Your Review</label>
            <textarea
              name="comment"
              placeholder="Share your experience with this product..."
              value={form.comment}
              onChange={handleChange}
              rows="4"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Posting...' : 'Post Review'}
            </button>
            <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading">Loading reviews...</div>
      ) : comments.length === 0 ? (
        <div className="empty">No reviews yet. Be the first to review!</div>
      ) : (
        <div className="comments-list">
          {comments.map(c => (
            <div key={c.id} className="comment-card">
              <div className="comment-header">
                <div className="comment-user">
                  <strong>{c.user_name}</strong>
                  {renderStars(c.rating)}
                </div>
                {user && user.id === c.user_id && (
                  <button className="btn-delete" onClick={() => handleDelete(c.id)}>Delete</button>
                )}
              </div>
              <p className="comment-text">{c.comment}</p>
              <div className="comment-meta">
                <small>{new Date(c.created_at).toLocaleDateString()}</small>
                <span className="helpful-count">{c.helpful_count} found this helpful</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
