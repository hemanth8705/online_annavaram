import React, { useState } from 'react'
import { SITE_CONFIG } from '../../../config/site'

const ProductCategory = () => {
  const [q, setQ] = useState('')
  const [price, setPrice] = useState(50)

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Category</label>
          <select className="border rounded-md px-2 py-1 text-sm">
            <option>All</option>
            {SITE_CONFIG.categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Search</label>
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search products" className="border rounded-md px-2 py-1 text-sm w-56" />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-sm text-gray-600 whitespace-nowrap">Max Price</label>
          <input type="range" className="oa-range w-full md:w-56" min="0" max="500" value={price} onChange={(e)=>setPrice(Number(e.target.value))} />
          <span className="text-sm text-gray-700">${'{'}price{'}'}</span>
        </div>
      </div>
    </div>
  )
}

export default ProductCategory
