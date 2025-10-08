import React, { Fragment, createContext, useReducer } from 'react'
import Layout from '../../layout/Layout.jsx'
import Slider from './Slider.jsx'
import ProductCategory from './ProductCategory.jsx'
import { homeState, homeReducer } from './HomeContext'
import SingleProduct from './SingleProduct.jsx'

export const HomeContext = createContext()

const HomeComponent = () => {
  return (
    <Fragment>
      <Slider />
      {/* Category, Search & Filter Section */}
      <section className="m-4 md:mx-8 md:my-6">
        <ProductCategory />
      </section>
      {/* Product Section */}
      <section className="m-4 md:mx-8 md:my-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <SingleProduct />
      </section>
    </Fragment>
  )
}

const Home = () => {
  const [data, dispatch] = useReducer(homeReducer, homeState)
  return (
    <HomeContext.Provider value={{ data, dispatch }}>
      <Layout>
        <HomeComponent />
      </Layout>
    </HomeContext.Provider>
  )
}

export default Home

