import React, { useMemo } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { SITE_CONTENT } from '../../config/site';
import useCart from '../../hooks/useCart';
import useAuth from '../../hooks/useAuth';

const Layout = ({ children }) => {
  const { brand, navLinks, footer } = SITE_CONTENT;
  const location = useLocation();
  const { cart } = useCart();
  const { user, logout } = useAuth();

  const activeNavLinks = useMemo(
    () =>
      navLinks.map((link) =>
        link.to
          ? link
          : {
              ...link,
              to: link.href || '#',
            }
      ),
    [navLinks]
  );

  const totalQuantity = cart?.totals?.quantity ?? 0;
  const content = children ?? <Outlet />;

  return (
    <div className="site-wrapper">
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="logo" aria-label={brand.name}>
            <img src="/images/logo.png" alt={`${brand.name} logo`} width="80" height="70" />
          </Link>
          <nav className="navigation" aria-label="Primary Navigation">
            <ul>
              {activeNavLinks.map((link) => (
                <li key={link.label}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) => (isActive ? 'active' : undefined)}
                    end={link.to === '/'}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="header-actions">
            {user ? (
              <div className="user-chip">
                <span>{user.fullName?.split(' ')[0] || 'Customer'}</span>
                <button type="button" onClick={logout}>
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/auth/login" className="btn-link" state={{ from: location.pathname }}>
                  Login
                </Link>
                <Link to="/auth/signup" className="btn btn-primary">
                  Sign Up
                </Link>
              </>
            )}
            <Link
              to="/cart"
              className="cart-chip"
              aria-label={`Cart with ${totalQuantity} items`}
              state={{ from: location.pathname }}
            >
              <span className="cart-chip__icon" aria-hidden="true">
                🛒
              </span>
              <span className="cart-chip__count">{totalQuantity}</span>
            </Link>
          </div>
        </div>
      </header>
      <main>{content}</main>
      <footer className="site-footer" id="footer">
        <div className="container footer-grid">
          {footer.columns.map((column) => (
            <div className="footer-col" key={column.title}>
              <h4>{column.title}</h4>
              <ul className={column.className ? column.className : undefined}>
                {column.links &&
                  column.links.map((link) =>
                    link.to ? (
                      <li key={link.label}>
                        <Link to={link.to}>{link.label}</Link>
                      </li>
                    ) : (
                      <li key={link.label}>
                        <a href={link.href}>{link.label}</a>
                      </li>
                    )
                  )}
                {column.items && column.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="container">
          <p className="copyright">
            {'\u00A9 '}
            {footer.copyright}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
