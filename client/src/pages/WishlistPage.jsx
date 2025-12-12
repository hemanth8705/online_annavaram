import React from 'react';
import Layout from '../components/layout/Layout';
import ProductGrid from '../components/products/ProductGrid';
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

          {items && items.length > 0 && <ProductGrid products={items} />}
        </div>
      </section>
    </Layout>
  );
};

export default WishlistPage;
