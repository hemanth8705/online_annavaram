import React, { useState } from 'react';
import Modal from './Modal';

const StarRating = ({ rating, onRatingChange, interactive = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleStarClick = (starValue) => {
    if (interactive && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  const handleStarHover = (starValue) => {
    if (interactive) {
      setHoverRating(starValue);
    }
  };

  const handleStarLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const displayRating = interactive ? (hoverRating || rating) : rating;

  return (
    <div 
      className="star-rating" 
      style={{ 
        display: 'flex', 
        gap: '0.25rem',
        fontSize: interactive ? '2rem' : '1rem'
      }}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleStarClick(star)}
          onMouseEnter={() => handleStarHover(star)}
          onMouseLeave={handleStarLeave}
          disabled={!interactive}
          style={{
            background: 'none',
            border: 'none',
            cursor: interactive ? 'pointer' : 'default',
            padding: 0,
            color: star <= displayRating ? '#fbbf24' : '#d1d5db',
            transition: 'color 0.2s'
          }}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

const ReviewModal = ({ isOpen, onClose, onSubmit, productName, isLoading = false }) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      setError('Please write a review');
      return;
    }

    try {
      await onSubmit({ rating, title: title.trim(), comment: comment.trim() });
      // Reset form
      setRating(0);
      setTitle('');
      setComment('');
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    }
  };

  const handleClose = () => {
    setRating(0);
    setTitle('');
    setComment('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Write a Review">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {productName && (
          <div>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Reviewing: <strong>{productName}</strong>
            </p>
          </div>
        )}

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Rating <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <StarRating rating={rating} onRatingChange={setRating} interactive />
          {rating > 0 && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
              You rated {rating} star{rating !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="review-title" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Review Title (optional)
          </label>
          <input
            id="review-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience"
            maxLength={100}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '1rem'
            }}
          />
        </div>

        <div>
          <label htmlFor="review-comment" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Your Review <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about this product..."
            maxLength={1000}
            rows={5}
            disabled={isLoading}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              resize: 'vertical'
            }}
          />
          <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280', textAlign: 'right' }}>
            {comment.length}/1000 characters
          </p>
        </div>

        {error && (
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: '#fee2e2', 
            border: '1px solid #fecaca',
            borderRadius: '0.375rem',
            color: '#991b1b',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export { StarRating };
export default ReviewModal;
