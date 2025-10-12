import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../lib/formatters';

const ProductCard = ({ product, onAddToCart, ctaLabel = 'Add to Cart' }) => {
  const price = formatCurrency(product.price);
  const imageSrc = product.images?.[0] || product.image || '/images/placeholder-product.jpg';
  const productId = product._id || product.id;

  return (
    <article className="product-card" data-testid={`product-${productId}`}>
      <Link to={`/products/${productId}`} aria-label={product.name}>
        <img src={imageSrc} alt={product.name} className="product-img" />
      </Link>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3 className="product-name">
          <Link to={`/products/${productId}`}>{product.name}</Link>
        </h3>
        <span className="product-price">{price}</span>
        <button
          type="button"
          className="btn btn-secondary product-card__btn"
          onClick={() => onAddToCart?.(product)}
        >
          {ctaLabel}
        </button>
      </div>
    </article>
  );
};

export default ProductCard;
