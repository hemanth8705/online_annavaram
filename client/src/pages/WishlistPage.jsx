import React from 'react';
import Layout from '../components/layout/Layout';
import ProductCard from '../components/products/ProductCard';
import useWishlist from '../hooks/useWishlist';

const WishlistPage = () => {
  const { items } = useWishlist();

  return (
    <Layout>
      <section className="section">
        <div className="container">
          <header className="page-header__inner">
            <div>
              <h1>Your Wishlist</h1>
              <p>Save your temple-town favourites to pick up later.</p>
            </div>
          </header>

          {(!items || items.length === 0) && (
            <div className="empty-state">
              <h3>No favourites yet</h3>
              <p>Tap the heart on any product to add it here.</p>
            </div>
          )}

          {items && items.length > 0 && (
            <div className="product-grid wishlist-grid">
              {items.map((product) => {
                // Normalize product data for ProductCard
                const normalizedProduct = {
                  _id: product.productId || product.id || product._id,
                  id: product.productId || product.id || product._id,
                  productId: product.productId || product.id || product._id,
                  name: product.name,
                  price: product.price,
                  category: product.category,
                  slug: product.slug,
                  images: product.images || (product.image ? [product.image] : []),
                  image: product.image || (product.images && product.images[0]),
                  stock: product.stock,
                };
                return (
                  <ProductCard 
                    key={normalizedProduct._id || normalizedProduct.name} 
                    product={normalizedProduct} 
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default WishlistPage;
