import React from 'react'

const NavBar = () => (
  <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
    <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <span className="font-bold text-lg">Online Annavaram</span>
      <nav className="space-x-4 text-sm">
        <a href="#" className="text-gray-700 hover:text-gray-900">Home</a>
        <a href="#" className="text-gray-700 hover:text-gray-900">Shop</a>
        <a href="#" className="text-gray-700 hover:text-gray-900">Contact</a>
      </nav>
    </div>
  </header>
)

const Footer = () => (
  <footer className="mt-auto bg-gray-900 text-gray-200">
    <div className="max-w-6xl mx-auto px-4 py-6 text-sm flex items-center justify-between">
      <span>© {new Date().getFullYear()} Online Annavaram</span>
      <span className="opacity-80">Built step-by-step</span>
    </div>
  </footer>
)

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

export default Layout

