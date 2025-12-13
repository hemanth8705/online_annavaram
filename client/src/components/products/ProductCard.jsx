import React, { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../lib/formatters';
import QuantityInput from '../common/QuantityInput';
import useCart from '../../hooks/useCart';
import useAuth from '../../hooks/useAuth';
import useWishlist from '../../hooks/useWishlist';
import { useToast } from '../../context/ToastContext';
import { HeartIcon } from '../common/Icons';

// Compact Star Rating Display for product cards
const ProductRating = ({ rating, reviewCount }) => {
  if (!rating || rating === 0) return null;
  
  return (
    <span style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '0.25rem',
      fontSize: '0.8rem',
      color: '#6b7280'
    }}>
      <span style={{ color: '#fbbf24' }}>★</span>
      <span style={{ fontWeight: '500' }}>{rating.toFixed(1)}</span>
      {reviewCount > 0 && <span>({reviewCount})</span>}
    </span>
  );
};

function resolveProductId(product = {}) {
  const rawId =
    product._id ||
    product.id ||
    product.productId ||
    product.slug ||
    (product.name ? product.name.toLowerCase().replace(/\s+/g, '-') : undefined);
  return rawId ? String(rawId) : undefined;
}

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, addItem, updateItemQuantity } = useCart();
  const { accessToken, hydrated } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { showToast } = useToast();

  const productId = resolveProductId(product);
  const price = formatCurrency(product.price);
  const imageSrc = product.images?.[0] || product.image || '/images/placeholder-product.jpg';

  const cartItem = useMemo(() => {
    if (!productId) {
      return undefined;
    }
    return cart.items.find((item) => {
      const itemId = String(item.productId || item.id || '');
      return itemId === productId || itemId === `local-${productId}`;
    });
  }, [cart.items, productId]);

  const handleAddToCartClick = async () => {
    console.log('[UI] Add to Cart clicked', { productId, product, cartItem });
    if (!hydrated || !accessToken) {
      showToast('Please log in to add items to your cart', 'info');
      navigate('/auth/login', {
        replace: false,
        state: { from: `${location.pathname}${location.search}` },
      });
      return;
    }
    try {
      await addItem(product, 1);
      showToast(`${product.name} added to cart!`, 'success');
    } catch (error) {
      console.error('[UI] Failed to add item from product card', error);
      showToast('Failed to add item to cart', 'error');
    }
  };

  const handleQuantityChange = (nextQuantity) => {
    if (!cartItem) {
      return;
    }
    console.log('[UI] Quantity change from product card', {
      productId,
      cartItemId: cartItem.id,
      nextQuantity,
    });
    updateItemQuantity(cartItem.id, nextQuantity);
  };

  const handleGoToCart = () => {
    console.log('[UI] Navigating to cart from product card', { productId });
    navigate('/cart');
  };

  const handleWishlistClick = () => {
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

  const productLink = productId ? `/products/${productId}` : '/products';
  const wishlisted = isWishlisted(product);

  return (
    <article className="product-card" data-testid={`product-${productId || product.name}`}>
      <div className="product-card__image-wrap">
        <Link to={productLink} aria-label={product.name}>
          <img 
            src={imageSrc} 
            alt={product.name} 
            className="product-img" 
            loading="lazy"
            decoding="async"
          />
        </Link>
        <button
          type="button"
          className={`wishlist-heart ${wishlisted ? 'wishlist-heart--active' : ''}`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={handleWishlistClick}
          disabled={!hydrated}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <HeartIcon size={24} filled={wishlisted} color={wishlisted ? '#b45309' : '#000000'} />
        </button>
      </div>
      <div className="product-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <span className="product-category">{product.category}</span>
          <ProductRating rating={product.averageRating} reviewCount={product.reviewCount} />
        </div>
        <h3 className="product-name">
          <Link to={productLink}>{product.name}</Link>
        </h3>
        <span className="product-price">{price}</span>

        {!cartItem && (
          <>
            <button
              type="button"
              className="btn btn-secondary product-card__btn"
              onClick={handleAddToCartClick}
              disabled={!hydrated || (product.stock !== undefined && product.stock <= 0)}
            >
              {product.stock !== undefined && product.stock <= 0 ? 'Out of Stock' : (product.actionLabel || 'Add to Cart')}
            </button>
            {product.stock !== undefined && product.stock > 0 && product.stock <= 5 && (
              <span style={{ fontSize: '0.75rem', color: '#f59e0b', textAlign: 'center' }}>
                Only {product.stock} left!
              </span>
            )}
          </>
        )}

        {cartItem && (
          <div className="product-card__controls" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <QuantityInput value={cartItem.quantity} onChange={handleQuantityChange} min={0} max={product.stock || 10} />
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '0.875rem',
                  color: '#ffffff',
                  fontWeight: 500,
                }}
              >
                {formatCurrency(product.price * cartItem.quantity)}
              </span>
            </div>
            {product.stock > 0 && cartItem.quantity >= product.stock && (
              <span style={{ fontSize: '0.75rem', color: '#f59e0b', textAlign: 'center' }}>
                Max stock reached
              </span>
            )}
            <button type="button" className="btn btn-primary" onClick={handleGoToCart} style={{ width: '100%' }}>
              Go to Cart
            </button>
          </div>
        )}
      </div>
    </article>
  );
};

export default ProductCard;
