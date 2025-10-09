import React from 'react'
import { SITE_CONTENT } from '../../config/site'

const Layout = ({ children }) => {
  const { brand, navLinks, footer } = SITE_CONTENT

  return (
    <div className="site-wrapper">
      <header className="site-header">
        <div className="container header-inner">
          <a href="#" className="logo" aria-label={brand.name}>
            <img src="/images/logo.png" alt={`${brand.name} logo`} width="80" height="70" />
          </a>
          <nav className="navigation" aria-label="Primary Navigation">
            <ul>
              {navLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="site-footer" id="footer">
        <div className="container footer-grid">
          {footer.columns.map((column) => (
            <div className="footer-col" key={column.title}>
              <h4>{column.title}</h4>
              <ul className={column.className ? column.className : undefined}>
                {column.links &&
                  column.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href}>{link.label}</a>
                    </li>
                  ))}
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
  )
}

export default Layout
