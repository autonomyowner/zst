"use client"

import Link from "next/link"

export default function LandingPage() {
  return (
    <main className="space-y-4">
      {/* Hero Section */}
      <section className="py-8 mt-4">
        <div className="bg-black text-white px-6 py-12 rounded-2xl mx-1">
          <div className="max-w-none mx-auto px-2">
            <div className="grid lg:grid-cols-3 gap-8 items-center">
            {/* Left Side - Value Proposition */}
            <div className="lg:col-span-2 space-y-4">
              <h1 className="text-3xl lg:text-5xl font-bold leading-tight">
                Quality Products,<br />
                Trusted Suppliers
              </h1>
              <p className="text-base lg:text-lg text-gray-300 max-w-lg">
                Find everything you need for your business from verified global suppliers. 
                Enjoy secure transactions and reliable delivery.
              </p>
              
              {/* Search Bar */}
              <div className="flex items-center bg-white rounded-lg p-1.5 max-w-lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 ml-2">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input 
                  type="text" 
                  placeholder="Search for any product or brand"
                  className="flex-1 px-2 py-1.5 text-black placeholder-gray-500 outline-none text-sm"
                />
                <button className="bg-yellow-400 text-black p-1.5 rounded-md hover:bg-yellow-300 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14m-7-7l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Right Side - Product Grid */}
            <div className="lg:col-span-1 grid grid-cols-3 gap-4 relative overflow-hidden">
              {/* Left column cards - Rising animation */}
              <div className="space-y-4">
                <div className="bg-white rounded-lg flex items-center justify-center p-2 h-32 animate-rise-through">
                  <div className="w-full h-full bg-black rounded-lg flex items-center justify-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
                <div className="bg-white rounded-lg flex items-center justify-center p-2 h-32 animate-rise-through-delay-1">
                  <div className="w-full h-full bg-orange-200 rounded-lg"></div>
                </div>
                <div className="bg-white rounded-lg flex items-center justify-center p-2 h-32 animate-rise-through-delay-2">
                  <div className="w-full h-full bg-pink-200 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 bg-pink-400 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              {/* Middle column cards - Rising animation */}
              <div className="space-y-4">
                <div className="bg-white rounded-lg flex items-center justify-center p-2 h-32 animate-rise-through">
                  <div className="w-full h-full bg-yellow-400 rounded-lg"></div>
                </div>
                <div className="bg-white rounded-lg flex items-center justify-center p-2 h-32 animate-rise-through-delay-1">
                  <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
                    <div className="w-8 h-12 bg-gray-600 rounded"></div>
                  </div>
                </div>
                <div className="bg-white rounded-lg flex items-center justify-center p-2 h-32 animate-rise-through-delay-2">
                  <div className="w-full h-full bg-yellow-600 rounded-lg"></div>
                </div>
              </div>
              
              {/* Right column cards - Rising animation */}
              <div className="space-y-4">
                <div className="bg-white rounded-lg flex items-center justify-center p-2 h-32 animate-rise-through">
                  <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="w-12 h-8 bg-gray-400 rounded"></div>
                  </div>
                </div>
                <div className="bg-white rounded-lg flex items-center justify-center p-2 h-32 animate-rise-through-delay-1">
                  <div className="w-full h-full bg-teal-600 rounded-lg"></div>
                </div>
                <div className="bg-white rounded-lg flex items-center justify-center p-2 h-32 animate-rise-through-delay-2">
                  <div className="w-full h-full bg-gray-400 rounded-lg"></div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="py-4 bg-white">
        <div className="px-4">
          <div className="flex items-center justify-center gap-6 overflow-x-auto">
            {/* Category items */}
            {[
              { 
                name: "Gaming", 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 11h4M8 9v4M18 9h-2M18 13h-2M14 9h-2M14 13h-2"/><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/></svg>
              },
              { 
                name: "Mobility", 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16.1 10 13 10s-5.7.6-6.5 1.1C5.7 11.3 5 12.1 5 13v3c0 .6.4 1 1 1h2m-3 0v3c0 .6.4 1 1 1h1c.6 0 1-.4 1-1v-3m-3 0h3m0 0h3m-3 0v3c0 .6.4 1 1 1h1c.6 0 1-.4 1-1v-3m0 0h3"/></svg>
              },
              { 
                name: "Monitor", 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              },
              { 
                name: "Phone", 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              },
              { 
                name: "Clothing", 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>
              },
              { 
                name: "Home", 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
              },
              { 
                name: "Kids", 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3c0 .74.29 1.41.76 1.91L12 8l2.24-1.09A3 3 0 0 0 12 2z"/><path d="M8 12a4 4 0 0 0-4 4v6h8v-6a4 4 0 0 0-4-4z"/><path d="M16 12a4 4 0 0 0-4 4v6h8v-6a4 4 0 0 0-4-4z"/></svg>
              },
              { 
                name: "DIY", 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              },
              { 
                name: "PC", 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              },
              { 
                name: "Sport", 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6.5 6.5h11v11h-11z"/><path d="M6.5 6.5L12 12l5.5-5.5"/><path d="M12 12l5.5 5.5"/><path d="M12 12L6.5 17.5"/></svg>
              },
              { 
                name: "Camera", 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              },
              { 
                name: "Garden", 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              }
            ].map((category, index) => (
              <Link 
                key={index} 
                href="#" 
                className="flex flex-col items-center gap-1 p-3 hover:bg-gray-50 rounded-lg transition-colors min-w-[70px]"
              >
                <div className="text-black">{category.icon}</div>
                <span className="text-sm font-medium text-black">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Product Discovery Sections */}
      {/* Trending Products */}
      <section className="py-6 bg-white">
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-black">Trending products</h2>
            <Link href="#" className="flex items-center gap-2 text-black hover:text-gray-600 font-medium">
              View all
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14m-7-7l7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {/* Product Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                </div>
                <div className="text-center">
                  <span className="text-xs font-medium text-black">Popular</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clothes */}
      <section className="py-6 bg-white">
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-black">Clothes</h2>
            <Link href="#" className="flex items-center gap-2 text-black hover:text-gray-600 font-medium">
              View all
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14m-7-7l7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {/* Product Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                </div>
                <div className="text-center">
                  <span className="text-xs font-medium text-black">Popular</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Phones */}
      <section className="py-6 bg-white">
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-black">Phones</h2>
            <Link href="#" className="flex items-center gap-2 text-black hover:text-gray-600 font-medium">
              View all
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14m-7-7l7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {/* Product Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                </div>
                <div className="text-center">
                  <span className="text-xs font-medium text-black">Popular</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Games */}
      <section className="py-6 bg-white">
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-black">Games</h2>
            <Link href="#" className="flex items-center gap-2 text-black hover:text-gray-600 font-medium">
              View all
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14m-7-7l7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {/* Product Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                </div>
                <div className="text-center">
                  <span className="text-xs font-medium text-black">Popular</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Home Equipment */}
      <section className="py-6 bg-white">
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-black">Home Equipment</h2>
            <Link href="#" className="flex items-center gap-2 text-black hover:text-gray-600 font-medium">
              View all
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14m-7-7l7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {/* Product Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                </div>
                <div className="text-center">
                  <span className="text-xs font-medium text-black">Popular</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="py-6 bg-white">
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-black">Tools</h2>
            <Link href="#" className="flex items-center gap-2 text-black hover:text-gray-600 font-medium">
              View all
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14m-7-7l7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {/* Product Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                </div>
                <div className="text-center">
                  <span className="text-xs font-medium text-black">Popular</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
