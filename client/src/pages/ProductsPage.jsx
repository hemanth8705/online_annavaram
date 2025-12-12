import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProductGrid from '../components/products/ProductGrid';
import LoadingState from '../components/common/LoadingState';
import ErrorMessage from '../components/common/ErrorMessage';
import { getProducts } from '../lib/apiClient';
import { SITE_CONTENT } from '../config/site';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const categoryFilter = searchParams.get('category') || 'all';
  const sortBy = searchParams.get('sortBy') || 'newest';

  useEffect(() => {
    let mounted = true;
    const abortController = new AbortController();

    async function loadProducts() {
      setStatus('loading');
      setError(null);
      try {
        const params = {};
        if (categoryFilter !== 'all') {
          params.category = categoryFilter;
        }
        if (sortBy && sortBy !== 'newest') {
          params.sortBy = sortBy;
          params.sortOrder = sortBy === 'price-low' ? 'asc' : sortBy === 'price-high' ? 'desc' : 'desc';
        }
        
        const response = await getProducts(params, { signal: abortController.signal });
        const items = response?.data ?? response ?? [];
        if (mounted) {
          console.log('[Products] loaded products', {
            count: items.length,
            categoryFilter,
            sortBy,
          });
          setProducts(items);
          setStatus('ready');
        }
      } catch (err) {
        if (!mounted || abortController.signal.aborted) {
          return;
        }
        console.error('[Products] failed to load', err);
        setProducts([]);
        setStatus('error');
        setError(err);
      }
    }

    loadProducts();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [categoryFilter, sortBy]);

  const categories = useMemo(() => {
    const fromConfig = SITE_CONTENT.productSections.flatMap((section) =>
      section.items.map((item) => item.category)
    );
    const fromProducts = products.map((product) => product.category).filter(Boolean);
    const unique = new Set(['all', ...fromConfig, ...fromProducts]);
    return Array.from(unique);
  }, [products]);

  const handleCategoryChange = (category) => {
    const newParams = new URLSearchParams(searchParams);
    if (category === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', category);
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleSortChange = (sort) => {
    const newParams = new URLSearchParams(searchParams);
    if (sort === 'newest') {
      newParams.delete('sortBy');
    } else {
      newParams.set('sortBy', sort);
    }
    setSearchParams(newParams, { replace: true });
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
            <div className="filter-group">
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
            <div className="filter-group">
              <label htmlFor="sort-filter">Sort by</label>
              <select
                id="sort-filter"
                value={sortBy}
                onChange={(event) => handleSortChange(event.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {status === 'loading' && <LoadingState label="Loading snacks..." />}
          {status === 'ready' && products.length > 0 && <ProductGrid products={products} />}
          {status === 'ready' && products.length === 0 && (
            <ErrorMessage
              title="No products available"
              message="We couldn't find any products for this category."
            />
          )}
          {status === 'error' && (
            <ErrorMessage
              title="Unable to load products"
              message={error?.message || 'Please try again later.'}
            />
          )}
        </div>
      </section>
    </Layout>
  );
};

export default ProductsPage;
