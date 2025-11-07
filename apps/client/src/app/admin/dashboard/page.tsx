"use client"

import React from 'react'

export default function AdminDashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Admin Dashboard</h1>
      <p className="text-sm sm:text-base text-gray-700">
        Welcome to the Admin Dashboard. Here you can manage users, products, orders, and categories across the platform.
      </p>
      {/* Future: Add admin-specific components and data displays */}
    </div>
  )
}