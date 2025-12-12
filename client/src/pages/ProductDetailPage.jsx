import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import LoadingState from '../components/common/LoadingState';
import ErrorMessage from '../components/common/ErrorMessage';
import QuantityInput from '../components/common/QuantityInput';
import { getProductById } from '../lib/apiClient';
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
  const { accessToken, hydrated } = useAuth();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

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
        </div>
      </section>
    </Layout>
  );
};

export default ProductDetailPage;
