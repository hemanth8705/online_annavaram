import React from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ products }) => {
  if (!products?.length) {
    return (
      <div className="empty-state">
        <h3>No products found</h3>
        <p>Try adjusting filters or come back soon for fresh batches.</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product._id || product.id || product.slug || product.name} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;
