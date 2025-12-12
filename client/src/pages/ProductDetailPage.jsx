import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import LoadingState from '../components/common/LoadingState';
import ErrorMessage from '../components/common/ErrorMessage';
import QuantityInput from '../components/common/QuantityInput';
import { getProductById, getProductReviews, createReview } from '../lib/apiClient';
import { FALLBACK_PRODUCTS } from '../config/site';
import { formatCurrency } from '../lib/formatters';
import useCart from '../hooks/useCart';
import useAuth from '../hooks/useAuth';
import useWishlist from '../hooks/useWishlist';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { accessToken, hydrated, user } = useAuth();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [reviewStatus, setReviewStatus] = useState('idle');
  const [reviewError, setReviewError] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });

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

  const handleAddToCart = async () => {
    console.log('[ProductDetail] add to cart clicked', { productId, quantity });
    if (!hydrated || !accessToken) {
      navigate('/auth/login', {
        replace: false,
        state: { from: `${location.pathname}${location.search}` },
      });
      return;
    }
    await addItem(product, quantity);
    navigate('/cart', { state: { from: `/products/${productId}` } });
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    toggleWishlist(product);
  };

  const handleReviewChange = (event) => {
    const { name, value } = event.target;
    setReviewForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!accessToken) {
      navigate('/auth/login', { state: { from: location.pathname } });
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
      setReviewForm({ rating: 5, title: '', comment: '' });
      await loadReviews(product._id || product.id);
    } catch (err) {
      console.warn('Failed to submit review', err);
      setReviewError(err);
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
              <div className="product-detail__image">
                <img src={image} alt={product.name} />
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
                <p className="product-detail__price">{formatCurrency(product.price)}</p>

                <div className="product-detail__actions">
                  <QuantityInput value={quantity} onChange={setQuantity} min={1} max={10} />
                  <button type="button" className="btn btn-primary" onClick={handleAddToCart}>
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    className={`btn btn-outline ${wishlisted ? 'btn-outline--active' : ''}`}
                    onClick={handleToggleWishlist}
                  >
                    {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                  </button>
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
              <header className="reviews-header">
                <div>
                  <h2>Customer Reviews</h2>
                  <p>
                    {reviewStats.totalReviews > 0
                      ? `${reviewStats.averageRating}★ average from ${reviewStats.totalReviews} review${reviewStats.totalReviews > 1 ? 's' : ''}`
                      : 'No reviews yet'}
                  </p>
                </div>
              </header>

              {reviewError && (
                <p className="form-error">
                  {reviewError.message || 'Unable to load reviews. Please try again.'}
                </p>
              )}

              {reviews.length === 0 && <p className="empty-state">No reviews yet. Be the first to share your experience.</p>}

              {reviews.length > 0 && (
                <ul className="reviews-list">
                  {reviews.map((rev) => (
                    <li key={rev.id} className="review-card">
                      <div className="review-card__header">
                        <div className="review-rating">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
                        <div className="review-meta">
                          <strong>{rev.user?.fullName || 'Customer'}</strong>
                          {rev.isVerifiedPurchase && <span className="verified-badge">Verified purchase</span>}
                          {rev.createdAt && <span className="review-date">{new Date(rev.createdAt).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      {rev.title && <h4>{rev.title}</h4>}
                      {rev.comment && <p>{rev.comment}</p>}
                    </li>
                  ))}
                </ul>
              )}

              <div className="review-form-card">
                <h3>Write a Review</h3>
                {!accessToken && (
                  <p className="form-hint">
                    <button type="button" className="btn btn-primary" onClick={() => navigate('/auth/login', { state: { from: location.pathname } })}>
                      Log in to write a review
                    </button>
                  </p>
                )}
                {accessToken && (
                  <form className="review-form" onSubmit={handleReviewSubmit}>
                    <div className="form-field">
                      <label htmlFor="rating">Rating</label>
                      <select id="rating" name="rating" value={reviewForm.rating} onChange={handleReviewChange}>
                        {[5, 4, 3, 2, 1].map((val) => (
                          <option key={val} value={val}>{val} - {['Excellent','Good','OK','Fair','Poor'][5 - val]}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-field">
                      <label htmlFor="title">Title</label>
                      <input
                        id="title"
                        name="title"
                        value={reviewForm.title}
                        onChange={handleReviewChange}
                        placeholder="Summarize your experience"
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="comment">Comment</label>
                      <textarea
                        id="comment"
                        name="comment"
                        value={reviewForm.comment}
                        onChange={handleReviewChange}
                        rows={3}
                        placeholder="Share details others would find helpful"
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={reviewStatus === 'saving'}>
                      {reviewStatus === 'saving' ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default ProductDetailPage;
