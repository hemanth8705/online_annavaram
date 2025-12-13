import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import LoadingState from '../components/common/LoadingState';
import ErrorMessage from '../components/common/ErrorMessage';
import Modal from '../components/common/Modal';
import QuantityInput from '../components/common/QuantityInput';
import { getProductById, getProductReviews, createReview } from '../lib/apiClient';
import { FALLBACK_PRODUCTS } from '../config/site';
import { formatCurrency } from '../lib/formatters';
import useCart from '../hooks/useCart';
import useAuth from '../hooks/useAuth';
import useWishlist from '../hooks/useWishlist';
import { useToast } from '../context/ToastContext';

// Interactive Star Rating Component
const StarRatingInput = ({ rating, onRatingChange }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div style={{ display: 'flex', gap: '0.25rem' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem',
            fontSize: '2rem',
            color: star <= (hoverRating || rating) ? '#fbbf24' : '#d1d5db',
            transition: 'color 0.15s, transform 0.15s',
            transform: star <= hoverRating ? 'scale(1.1)' : 'scale(1)',
          }}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

// Display-only Star Rating Component
const StarRatingDisplay = ({ rating, size = '1rem' }) => {
  return (
    <span style={{ color: '#fbbf24', fontSize: size }}>
      {'★'.repeat(Math.floor(rating))}
      {'☆'.repeat(5 - Math.floor(rating))}
    </span>
  );
};

const ProductDetailPage = () => {
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, addItem, updateItemQuantity } = useCart();
  const { accessToken, hydrated, user } = useAuth();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { showToast } = useToast();
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [reviewStatus, setReviewStatus] = useState('idle');
  const [reviewError, setReviewError] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 0, title: '', comment: '' });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadProduct() {
      setStatus('loading');
      setError(null);
      try {
        const response = await getProductById(productId);
        const data = response?.data ?? response;
        if (mounted) {
          setProduct(data);
          setStatus('ready');
        }
      } catch (err) {
        console.warn('Product detail falling back to static data', err);
        if (!mounted) {
          return;
        }
        const fallback = FALLBACK_PRODUCTS.find(
          (item) => item.id === productId || item._id === productId
        );
        if (fallback) {
          setProduct(fallback);
          setStatus('fallback');
        } else {
          setStatus('error');
          setError(err);
        }
      }
    }

    loadProduct();

    return () => {
      mounted = false;
    };
  }, [productId]);

  const loadReviews = async (id) => {
    if (!id) return;
    setReviewStatus('loading');
    setReviewError(null);
    try {
      const response = await getProductReviews(id, { limit: 20 });
      const data = response?.data || {};
      setReviews(data.reviews || []);
      setReviewStats(data.stats || { averageRating: 0, totalReviews: 0 });
    } catch (err) {
      console.warn('Failed to load reviews', err);
      setReviewError(err);
    } finally {
      setReviewStatus('ready');
    }
  };

  useEffect(() => {
    if (product?._id || product?.id) {
      loadReviews(product._id || product.id);
    }
  }, [product?._id, product?.id]);

  const image = useMemo(
    () => product?.images?.[0] || '/images/placeholder-product.jpg',
    [product]
  );
  const wishlisted = isWishlisted(product);

  // Find if product is already in cart
  const cartItem = useMemo(() => {
    if (!productId) return undefined;
    return cart.items.find((item) => {
      const itemId = String(item.productId || item.id || '');
      return itemId === productId || itemId === `local-${productId}`;
    });
  }, [cart.items, productId]);

  const handleAddToCart = async () => {
    console.log('[ProductDetail] add to cart clicked', { productId });
    if (!hydrated || !accessToken) {
      showToast('Please log in to add items to your cart', 'info');
      navigate('/auth/login', {
        replace: false,
        state: { from: `${location.pathname}${location.search}` },
      });
      return;
    }
    setAddingToCart(true);
    try {
      await addItem(product, 1);
      showToast(`${product.name} added to cart!`, 'success');
    } catch (err) {
      console.error('Failed to add to cart', err);
      showToast(err.message || 'Unable to add item to cart. Please try again.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleUpdateCartQuantity = (newQuantity) => {
    if (!cartItem) return;
    updateItemQuantity(cartItem.id, newQuantity);
  };

  const handleGoToCart = () => {
    navigate('/cart');
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    if (!hydrated || !accessToken) {
      showToast('Please log in to add items to your wishlist', 'info');
      navigate('/auth/login', {
        replace: false,
        state: { from: `${location.pathname}${location.search}` },
      });
      return;
    }
    toggleWishlist(product);
  };

  const handleReviewChange = (event) => {
    const { name, value } = event.target;
    setReviewForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenReviewModal = () => {
    if (!accessToken) {
      navigate('/auth/login', { state: { from: location.pathname } });
      return;
    }
    setReviewForm({ rating: 0, title: '', comment: '' });
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!accessToken) {
      navigate('/auth/login', { state: { from: location.pathname } });
      return;
    }
    if (reviewForm.rating === 0) {
      showToast('Please select a rating', 'error');
      return;
    }
    setReviewStatus('saving');
    setReviewError(null);
    try {
      await createReview(accessToken, {
        productId: product._id || product.id,
        rating: Number(reviewForm.rating),
        title: reviewForm.title,
        comment: reviewForm.comment,
      });
      setReviewForm({ rating: 0, title: '', comment: '' });
      setShowReviewModal(false);
      showToast('Review submitted successfully!', 'success');
      await loadReviews(product._id || product.id);
    } catch (err) {
      console.warn('Failed to submit review', err);
      setReviewError(err);
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setReviewStatus('ready');
    }
  };

  return (
    <Layout>
      <section className="section">
        <div className="container product-detail">
          {status === 'loading' && <LoadingState label="Preparing the batch..." />}

          {status === 'error' && (
            <ErrorMessage
              title="Product not found"
              message="This item may have sold out. Explore other specials from our kitchen."
              action={
                <button type="button" className="btn btn-primary" onClick={() => navigate('/products')}>
                  Back to products
                </button>
              }
            />
          )}

            {(status === 'ready' || status === 'fallback') && product && (
            <div className="product-detail__grid">
              <div className="product-detail__image" style={{ position: 'relative' }}>
                <img src={image} alt={product.name} />
                <button
                  type="button"
                  className={`wishlist-heart ${wishlisted ? 'wishlist-heart--active' : ''}`}
                  aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  onClick={handleToggleWishlist}
                  disabled={!hydrated}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    zIndex: 10
                  }}
                >
                  {wishlisted ? '♥' : '♡'}
                </button>
              </div>
              <div className="product-detail__info">
                <p className="product-detail__breadcrumb">
                  <button type="button" onClick={() => navigate(-1)} className="link-button">
                    Back
                  </button>{' '}
                  / {product.category}
                </p>
                <h1>{product.name}</h1>
                {product.description && <p className="product-detail__description">{product.description}</p>}
                <div className="product-detail__price-section">
                  <p className="product-detail__price">{formatCurrency(product.price)}</p>
                  {cartItem && cartItem.quantity > 1 && (
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      Total: {formatCurrency(product.price * cartItem.quantity)} ({cartItem.quantity} items)
                    </p>
                  )}
                </div>

                <div className="product-detail__actions">
                  {!cartItem ? (
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={handleAddToCart}
                      disabled={addingToCart || !hydrated}
                    >
                      {addingToCart ? 'Adding...' : 'Add to Cart'}
                    </button>
                  ) : (
                    <>
                      <QuantityInput 
                        value={cartItem.quantity} 
                        onChange={handleUpdateCartQuantity} 
                        min={0} 
                        max={10} 
                      />
                      <span style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '500' }}>
                        {formatCurrency(product.price * cartItem.quantity)}
                      </span>
                      <button 
                        type="button" 
                        className="btn btn-primary" 
                        onClick={handleGoToCart}
                      >
                        Go to Cart
                      </button>
                    </>
                  )}
                </div>

                <ul className="product-detail__meta">
                  <li>
                    <strong>Fresh Batch:</strong> Dispatches within 24 hours.
                  </li>
                  <li>
                    <strong>Stock:</strong>{' '}
                    {product.stock > 0 ? `${product.stock} units available` : 'Made to order'}
                  </li>
                  <li>
                    <strong>Packed in:</strong> Food-safe, tamper-proof boxes.
                  </li>
                </ul>
              </div>
            </div>
          )}
          {(status === 'ready' || status === 'fallback') && (
            <div className="reviews-section">
              <header className="reviews-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2>Customer Reviews</h2>
                  {reviewStats.totalReviews > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <StarRatingDisplay rating={reviewStats.averageRating} size="1.25rem" />
                      <span style={{ color: '#6b7280' }}>
                        {reviewStats.averageRating.toFixed(1)} from {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ) : (
                    <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>No reviews yet</p>
                  )}
                </div>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleOpenReviewModal}
                >
                  Write a Review
                </button>
              </header>

              {reviewError && !showReviewModal && (
                <p className="form-error">
                  {reviewError.message || 'Unable to load reviews. Please try again.'}
                </p>
              )}

              {reviews.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                  <p style={{ color: '#6b7280', marginBottom: '1rem' }}>No reviews yet. Be the first to share your experience!</p>
                </div>
              )}

              {reviews.length > 0 && (
                <ul className="reviews-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {reviews.map((rev) => (
                    <li key={rev.id} className="review-card" style={{ 
                      padding: '1.25rem', 
                      borderBottom: '1px solid #e5e7eb',
                      marginBottom: '0'
                    }}>
                      <div className="review-card__header" style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                          <StarRatingDisplay rating={rev.rating} />
                          <span style={{ fontWeight: '500' }}>{rev.user?.fullName || 'Customer'}</span>
                          {rev.isVerifiedPurchase && (
                            <span style={{ 
                              fontSize: '0.75rem', 
                              backgroundColor: '#dcfce7', 
                              color: '#166534',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '9999px'
                            }}>
                              Verified purchase
                            </span>
                          )}
                          {rev.createdAt && (
                            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                              {new Date(rev.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                      {rev.title && <h4 style={{ margin: '0 0 0.5rem', fontWeight: '600' }}>{rev.title}</h4>}
                      {rev.comment && <p style={{ margin: 0, color: '#374151', lineHeight: '1.6' }}>{rev.comment}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Write a Review"
      >
        <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Reviewing: <strong>{product?.name}</strong>
            </p>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Rating <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <StarRatingInput 
              rating={reviewForm.rating} 
              onRatingChange={(val) => setReviewForm(prev => ({ ...prev, rating: val }))} 
            />
            {reviewForm.rating > 0 && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                You rated {reviewForm.rating} star{reviewForm.rating !== 1 ? 's' : ''} - {['Poor', 'Fair', 'OK', 'Good', 'Excellent'][reviewForm.rating - 1]}
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
              name="title"
              value={reviewForm.title}
              onChange={handleReviewChange}
              placeholder="Summarize your experience"
              maxLength={100}
              disabled={reviewStatus === 'saving'}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label htmlFor="review-comment" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Your Review (optional)
            </label>
            <textarea
              id="review-comment"
              name="comment"
              value={reviewForm.comment}
              onChange={handleReviewChange}
              rows={4}
              placeholder="Share details about your experience with this product"
              maxLength={1000}
              disabled={reviewStatus === 'saving'}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              disabled={reviewStatus === 'saving'}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reviewStatus === 'saving' || reviewForm.rating === 0}
              className="btn btn-primary"
            >
              {reviewStatus === 'saving' ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default ProductDetailPage;
