export const homeState = {
  categoryListDropdown: false,
  filterListDropdown: false,
  searchDropdown: false,
  products: null,
  loading: false,
  sliderImages: [
    { id: 1, title: 'Fresh Groceries', desc: 'Everyday essentials delivered', color: 'from-amber-500 to-rose-500' },
    { id: 2, title: 'Best Deals', desc: 'Save more on top picks', color: 'from-blue-500 to-indigo-600' },
    { id: 3, title: 'New Arrivals', desc: 'Latest products in store', color: 'from-emerald-500 to-teal-600' }
  ],
}

export const homeReducer = (state, action) => {
  switch (action.type) {
    case 'categoryListDropdown':
      return { ...state, categoryListDropdown: action.payload, filterListDropdown: false, searchDropdown: false }
    case 'filterListDropdown':
      return { ...state, categoryListDropdown: false, filterListDropdown: action.payload, searchDropdown: false }
    case 'searchDropdown':
      return { ...state, categoryListDropdown: false, filterListDropdown: false, searchDropdown: action.payload }
    case 'setProducts':
      return { ...state, products: action.payload }
    case 'loading':
      return { ...state, loading: action.payload }
    default:
      return state
  }
}

