import React, { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../lib/formatters';
import QuantityInput from '../common/QuantityInput';
import useCart from '../../hooks/useCart';
import useAuth from '../../hooks/useAuth';

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
      navigate('/auth/login', {
        replace: false,
        state: { from: `${location.pathname}${location.search}` },
      });
      return;
    }
    try {
      await addItem(product, 1);
    } catch (error) {
      console.error('[UI] Failed to add item from product card', error);
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

  const productLink = productId ? `/products/${productId}` : '/products';

  return (
    <article className="product-card" data-testid={`product-${productId || product.name}`}>
      <Link to={productLink} aria-label={product.name}>
        <img src={imageSrc} alt={product.name} className="product-img" />
      </Link>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3 className="product-name">
          <Link to={productLink}>{product.name}</Link>
        </h3>
        <span className="product-price">{price}</span>

        {!cartItem && (
          <button
            type="button"
            className="btn btn-secondary product-card__btn"
            onClick={handleAddToCartClick}
            disabled={!hydrated}
          >
            {product.actionLabel || 'Add to Cart'}
          </button>
        )}

        {cartItem && (
          <div className="product-card__controls">
            <QuantityInput value={cartItem.quantity} onChange={handleQuantityChange} min={0} max={10} />
            <button type="button" className="btn btn-primary" onClick={handleGoToCart}>
              Go to Cart
            </button>
          </div>
        )}
      </div>
    </article>
  );
};

export default ProductCard;
