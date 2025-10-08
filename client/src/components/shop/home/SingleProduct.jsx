import React from 'react'
import { SITE_CONFIG } from '../../../config/site'

const Card = ({ title, price }) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
    <div className="h-36 bg-gray-100 flex items-center justify-center">
      <a href={SITE_CONFIG.instagramUrl} target="_blank" rel="noreferrer" className="text-gray-400 text-sm hover:text-gray-600">Instagram</a>
    </div>
    <div className="p-3">
      <h3 className="text-sm font-medium line-clamp-1">{title}</h3>
      <div className="flex items-center justify-between mt-2">
        <span className="text-amber-700 font-semibold">{SITE_CONFIG.currencySymbol}{'{'}price.toFixed(2){'}'}</span>
        <button className="text-xs px-2 py-1 rounded bg-gray-900 text-white">Add</button>
      </div>
    </div>
  </div>
)

const SingleProduct = () => {
  const names = ['wheat (dalia)','jaggery','sugar','ghee']
  const items = Array.from({ length: 8 }, (_, i) => ({ id: i+1, title: `${names[i % names.length]} ${i+1}`, price: 100 + i * 10 }))
  return (
    <>
      {items.map(x => (
        <div key={x.id} className="p-2">
          <Card title={x.title} price={x.price} />
        </div>
      ))}
    </>
  )
}

export default SingleProduct
