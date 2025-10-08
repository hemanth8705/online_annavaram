import React, { useEffect, useState } from 'react'
import { SITE_CONFIG } from '../../../config/site'

const slides = [
  { id: 1, src: '/images/home_image_1.png', alt: 'home_image_1' },
  { id: 2, src: '/images/home_image_2.png', alt: 'home_image_2' },
  { id: 3, src: '/images/home_image_3.png', alt: 'home_image_3' },
]

const Slider = () => {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 4000)
    return () => clearInterval(t)
  }, [])

  const slide = slides[idx]
  return (
    <section className="m-4 md:mx-8 md:my-6">
      <div className="max-w-6xl mx-auto">
        <a href={SITE_CONFIG.instagramUrl} target="_blank" rel="noreferrer" className="block">
          <img src={slide.src} alt={slide.alt} className="w-full h-56 md:h-72 lg:h-80 object-cover rounded-xl" />
        </a>
        <div className="flex gap-2 justify-center mt-3">
          {slides.map((s, i) => (
            <button key={s.id} onClick={() => setIdx(i)} className={`w-2.5 h-2.5 rounded-full ${i===idx? 'bg-gray-800':'bg-gray-300'}`} aria-label={`Go to slide ${i+1}`}></button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Slider
