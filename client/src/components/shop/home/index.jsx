import React, { useEffect, useRef } from 'react'
import Layout from '../../layout/Layout.jsx'
import { SITE_CONTENT } from '../../../config/site'

const useDragScroll = (ref) => {
  useEffect(() => {
    const el = ref.current
    if (!el) {
      return
    }

    let isDragging = false
    let startX = 0
    let initialScroll = 0

    const startDrag = (pageX) => {
      isDragging = true
      el.classList.add('dragging')
      startX = pageX - el.offsetLeft
      initialScroll = el.scrollLeft
    }

    const stopDrag = () => {
      isDragging = false
      el.classList.remove('dragging')
    }

    const handleMouseDown = (event) => {
      startDrag(event.pageX)
    }

    const handleMouseLeave = () => {
      stopDrag()
    }

    const handleMouseUp = () => {
      stopDrag()
    }

    const handleMouseMove = (event) => {
      if (!isDragging) {
        return
      }
      event.preventDefault()
      const x = event.pageX - el.offsetLeft
      const walk = (x - startX) * 2
      el.scrollLeft = initialScroll - walk
    }

    const handleTouchStart = (event) => {
      if (!event.touches[0]) {
        return
      }
      startDrag(event.touches[0].pageX)
    }

    const handleTouchMove = (event) => {
      if (!isDragging || !event.touches[0]) {
        return
      }
      const x = event.touches[0].pageX - el.offsetLeft
      const walk = (x - startX) * 2
      el.scrollLeft = initialScroll - walk
    }

    const handleTouchEnd = () => {
      stopDrag()
    }

    el.addEventListener('mousedown', handleMouseDown)
    el.addEventListener('mouseleave', handleMouseLeave)
    el.addEventListener('mouseup', handleMouseUp)
    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('touchstart', handleTouchStart)
    el.addEventListener('touchmove', handleTouchMove)
    el.addEventListener('touchend', handleTouchEnd)

    return () => {
      el.removeEventListener('mousedown', handleMouseDown)
      el.removeEventListener('mouseleave', handleMouseLeave)
      el.removeEventListener('mouseup', handleMouseUp)
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [ref])
}

const ProductCard = ({ product }) => (
  <div className="product-card">
    <img src={product.image} alt={product.name} className="product-img" />
    <div className="product-info">
      <span className="product-category">{product.category}</span>
      <h3 className="product-name">{product.name}</h3>
      <span className="product-price">{product.price}</span>
      <button type="button" className="btn btn-secondary">
        {product.actionLabel}
      </button>
    </div>
  </div>
)

const ProductSlider = ({ section }) => {
  const sliderRef = useRef(null)
  useDragScroll(sliderRef)

  return (
    <section className="section" id={section.id}>
      <div className="container">
        <h2 className="section-title">{section.title}</h2>
        <div className="product-slider" ref={sliderRef} role="list">
          {section.items.map((item) => (
            <ProductCard key={item.name} product={item} />
          ))}
        </div>
      </div>
    </section>
  )
}

const FeatureIcon = ({ type }) => {
  switch (type) {
    case 'lock':
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )
    case 'truck':
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      )
    case 'map':
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      )
    default:
      return null
  }
}

const HomeContent = () => {
  const { brand, productSections, infoBoxes, testimonial, features } = SITE_CONTENT
  const [firstSection, ...remainingSections] = productSections

  return (
    <>
      <section className="hero" id="hero">
        <div className="hero-overlay"></div>
        <div className="container hero-content">
          <h1 className="hero-title">{brand.name}</h1>
          <p className="hero-subtitle">{brand.tagline}</p>
          <p className="hero-text">{brand.description}</p>
          <a href={brand.cta.href} className="btn btn-primary">
            {brand.cta.label}
          </a>
        </div>
      </section>

      {firstSection && <ProductSlider section={firstSection} />}

      <section className="section collections" id="collections">
        <div className="container collection-grid">
          {infoBoxes.map((box) => (
            <div className="info-box" key={box.title}>
              <div className="info-box-image" style={{ backgroundImage: `url(${box.image})` }}></div>
              <div className="info-box-content">
                <h3>{box.title}</h3>
                <p>{box.description}</p>
                <a href={box.actionHref} className="btn btn-primary">
                  {box.actionLabel}
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {remainingSections.map((section) => (
        <ProductSlider key={section.id} section={section} />
      ))}

      <section className="section testimonial">
        <div className="container testimonial-inner">
          <div className="stars">{'\u2605\u2605\u2605\u2605\u2605'}</div>
          <p className="testimonial-text">{testimonial.quote}</p>
          <p className="testimonial-author">- {testimonial.author}, {testimonial.role}</p>
        </div>
      </section>

      <section className="section features">
        <div className="container features-grid">
          {features.map((feature) => (
            <div className="feature-item" key={feature.id}>
              <div className="feature-icon">
                <FeatureIcon type={feature.icon} />
              </div>
              <h4 className="feature-title">{feature.title}</h4>
              <p className="feature-desc">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

const Home = () => (
  <Layout>
    <HomeContent />
  </Layout>
)

export default Home
