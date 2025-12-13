import { useEffect, useState } from 'react';
import { reviewAPI, productAPI } from '../lib/api';
import { formatDateTime } from '../lib/utils';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    productId: '',
    rating: '',
  });

  // Edit Modal
  const [editingReview, setEditingReview] = useState(null);
  const [editForm, setEditForm] = useState({
    rating: 5,
    comment: '',
  });

  useEffect(() => {
    loadProducts();
    loadStats();
  }, []);

  useEffect(() => {
    loadReviews();
  }, [filters]);

  const loadReviews = async () => {
    try {
      let response;
      if (filters.productId) {
        response = await reviewAPI.getByProduct(filters.productId);
      } else {
        response = await reviewAPI.getAll();
      }

      let filteredReviews = response.data;

      if (filters.rating) {
        filteredReviews = filteredReviews.filter(
          (review) => review.rating === parseInt(filters.rating)
        );
      }

      setReviews(filteredReviews);
    } catch (err) {
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productAPI.getAll();
      setProducts(response.data.filter((p) => p.isActive));
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const loadStats = async () => {
    try {
      const response = await reviewAPI.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleClearFilters = () => {
    setFilters({
      productId: '',
      rating: '',
    });
  };

  const handleEditClick = (review) => {
    setEditingReview(review);
    setEditForm({
      rating: review.rating,
      comment: review.comment,
    });
    setError('');
    setSuccess('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await reviewAPI.update(editingReview._id, editForm);
      setSuccess('Review updated successfully');
      setEditingReview(null);
      loadReviews();
      loadStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update review');
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await reviewAPI.delete(reviewId);
      setSuccess('Review deleted successfully');
      loadReviews();
      loadStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete review');
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? 'text-yellow-500' : 'text-gray-300'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-dark">Reviews</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <div className="text-sm text-gray-600">Total Reviews</div>
            <div className="text-2xl font-bold text-dark">{stats.totalReviews}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Average Rating</div>
            <div className="text-2xl font-bold text-primary">
              {stats.averageRating.toFixed(1)} ★
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">5-Star Reviews</div>
            <div className="text-2xl font-bold text-dark">
              {stats.ratingDistribution['5'] || 0}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Products Reviewed</div>
            <div className="text-2xl font-bold text-secondary">
              {stats.reviewsByProduct?.length || 0}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="form-label">Product</label>
            <select
              value={filters.productId}
              onChange={(e) => handleFilterChange('productId', e.target.value)}
              className="form-input"
            >
              <option value="">All Products</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="form-label">Rating</label>
            <select
              value={filters.rating}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
              className="form-input"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <button onClick={handleClearFilters} className="btn-secondary">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>User ID</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-gray-500 py-8">
                    No reviews found
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {review.productId?.imageUrl && (
                          <img
                            src={review.productId.imageUrl}
                            alt={review.productId.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <span className="font-medium">{review.productId?.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="font-mono text-xs">{review.userId.slice(0, 8)}...</td>
                    <td>{renderStars(review.rating)}</td>
                    <td>
                      <div className="max-w-md">
                        <p className="text-sm text-gray-700 line-clamp-2">{review.comment}</p>
                      </div>
                    </td>
                    <td>{formatDateTime(review.createdAt)}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(review)}
                          className="btn-primary text-sm py-1 px-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(review._id)}
                          className="btn-danger text-sm py-1 px-3"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Review</h2>

            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="form-label">Product</label>
                <div className="font-medium text-gray-700">
                  {editingReview.productId?.name || 'N/A'}
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label">Rating *</label>
                <select
                  value={editForm.rating}
                  onChange={(e) =>
                    setEditForm({ ...editForm, rating: parseInt(e.target.value) })
                  }
                  className="form-input"
                  required
                >
                  <option value="5">5 Stars - Excellent</option>
                  <option value="4">4 Stars - Good</option>
                  <option value="3">3 Stars - Average</option>
                  <option value="2">2 Stars - Poor</option>
                  <option value="1">1 Star - Terrible</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label">Comment *</label>
                <textarea
                  value={editForm.comment}
                  onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                  className="form-input"
                  rows="4"
                  required
                  minLength="10"
                  placeholder="Write your review..."
                />
                <div className="text-xs text-gray-500 mt-1">
                  Minimum 10 characters
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">
                  Update Review
                </button>
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
