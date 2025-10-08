import React, { useEffect, useState } from 'react'
import { homeState as initial } from './HomeContext'

const SlideCard = ({ title, desc, gradient }) => (
  <div className={`h-56 md:h-72 lg:h-80 rounded-xl bg-gradient-to-r ${gradient} text-white flex items-center justify-center text-center px-6`}>
    <div>
      <h2 className="text-2xl md:text-3xl font-semibold">{title}</h2>
      <p className="opacity-90 mt-2">{desc}</p>
    </div>
  </div>
)

const Slider = () => {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % initial.sliderImages.length), 4000)
    return () => clearInterval(t)
  }, [])

  const slide = initial.sliderImages[idx]
  return (
    <section className="m-4 md:mx-8 md:my-6">
      <div className="max-w-6xl mx-auto">
        <SlideCard title={slide.title} desc={slide.desc} gradient={slide.color} />
        <div className="flex gap-2 justify-center mt-3">
          {initial.sliderImages.map((s, i) => (
            <button key={s.id} onClick={() => setIdx(i)} className={`w-2.5 h-2.5 rounded-full ${i===idx? 'bg-gray-800':'bg-gray-300'}`} aria-label={`Go to slide ${i+1}`}></button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Slider

