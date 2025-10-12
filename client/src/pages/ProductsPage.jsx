import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProductGrid from '../components/products/ProductGrid';
import LoadingState from '../components/common/LoadingState';
import ErrorMessage from '../components/common/ErrorMessage';
import { getProducts } from '../lib/apiClient';
import { FALLBACK_PRODUCTS, SITE_CONTENT } from '../config/site';
import useCart from '../hooks/useCart';

const ProductsPage = () => {
  const { addItem } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const categoryFilter = searchParams.get('category') || 'all';

  useEffect(() => {
    let mounted = true;
    const abortController = new AbortController();

    async function loadProducts() {
      setStatus('loading');
      setError(null);
      try {
        const response = await getProducts(
          categoryFilter !== 'all' ? { category: categoryFilter } : {},
          { signal: abortController.signal }
        );
        const items = response?.data ?? response ?? [];
        if (mounted) {
          setProducts(items);
          setStatus('ready');
        }
      } catch (err) {
        console.warn('Falling back to static products', err);
        if (!mounted || abortController.signal.aborted) {
          return;
        }
        setProducts(FALLBACK_PRODUCTS);
        setStatus('fallback');
        setError(err);
      }
    }

    loadProducts();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [categoryFilter]);

  const categories = useMemo(() => {
    const fromConfig = SITE_CONTENT.productSections.flatMap((section) =>
      section.items.map((item) => item.category)
    );
    const fromProducts = products.map((product) => product.category).filter(Boolean);
    const unique = new Set(['all', ...fromConfig, ...fromProducts]);
    return Array.from(unique);
  }, [products]);

  const handleCategoryChange = (category) => {
    if (category === 'all') {
      searchParams.delete('category');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ category }, { replace: true });
    }
  };

  return (
    <Layout>
      <section className="page-header">
        <div className="container page-header__inner">
          <div>
            <h1>Temple Pantry</h1>
            <p>Explore our fresh batches and festive specials.</p>
          </div>
          <div className="filters">
            <label htmlFor="category-filter">Filter by category</label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(event) => handleCategoryChange(event.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Collections' : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {status === 'loading' && <LoadingState label="Loading snacks..." />}
          {status !== 'loading' && (
            <ProductGrid
              products={products}
              onAddToCart={(product) => addItem(product, 1)}
            />
          )}
          {status === 'fallback' && (
            <ErrorMessage
              title="Live inventory unavailable"
              message="Showing handcrafted highlights while we reconnect to the kitchen."
            />
          )}
        </div>
      </section>
    </Layout>
  );
};

export default ProductsPage;
