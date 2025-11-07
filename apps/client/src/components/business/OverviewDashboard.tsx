"use client"

import { useState, useMemo } from 'react'
import { formatDZD } from '@/lib/utils/currency'
import type { OrderB2CWithItems, OrderB2BWithItems } from '@/types/database'

interface OverviewDashboardProps {
  b2cOrders: OrderB2CWithItems[]
  b2bOrders: OrderB2BWithItems[]
}

type TimePeriod = 'today' | 'yesterday' | 'this-week' | 'this-month'

export default function OverviewDashboard({ b2cOrders, b2bOrders }: OverviewDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today')

  const getDateRange = (period: TimePeriod) => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (period) {
      case 'today':
        return { start: startOfDay, end: now }
      case 'yesterday':
        const yesterday = new Date(startOfDay)
        yesterday.setDate(yesterday.getDate() - 1)
        const endOfYesterday = new Date(yesterday)
        endOfYesterday.setHours(23, 59, 59, 999)
        return { start: yesterday, end: endOfYesterday }
      case 'this-week':
        const startOfWeek = new Date(startOfDay)
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
        return { start: startOfWeek, end: now }
      case 'this-month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        return { start: startOfMonth, end: now }
      default:
        return { start: startOfDay, end: now }
    }
  }

  const filteredOrders = useMemo(() => {
    const { start, end } = getDateRange(selectedPeriod)
    
    const filteredB2C = b2cOrders.filter(order => {
      const orderDate = new Date(order.created_at)
      return orderDate >= start && orderDate <= end
    })

    const filteredB2B = b2bOrders.filter(order => {
      const orderDate = new Date(order.created_at)
      return orderDate >= start && orderDate <= end
    })

    return { b2c: filteredB2C, b2b: filteredB2B }
  }, [b2cOrders, b2bOrders, selectedPeriod])

  const ordersCount = filteredOrders.b2c.length + filteredOrders.b2b.length

  const earnings = useMemo(() => {
    const b2cEarnings = filteredOrders.b2c
      .filter(o => o.status === 'delivered')
      .reduce((sum, order) => {
        const orderTotal = order.items?.reduce((itemSum, item) => 
          itemSum + (item.price_at_purchase * item.quantity), 0) || 0
        return sum + orderTotal
      }, 0)

    const b2bEarnings = filteredOrders.b2b
      .filter(o => o.status === 'completed')
      .reduce((sum, order) => sum + order.total_price, 0)

    return b2cEarnings + b2bEarnings
  }, [filteredOrders])

  const periods: { id: TimePeriod; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'this-week', label: 'This week' },
    { id: 'this-month', label: 'This month' },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">Overview dashboard</h2>
      
      {/* Period Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
        {periods.map((period) => (
          <button
            key={period.id}
            onClick={() => setSelectedPeriod(period.id)}
            className={`
              px-4 py-2 text-sm font-medium rounded-lg transition-colors min-h-[44px]
              ${selectedPeriod === period.id
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Orders Column */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-4">Orders</h3>
          <div className="space-y-3">
            {periods.map((period) => {
              const { start, end } = getDateRange(period.id)
              const count = [...b2cOrders, ...b2bOrders].filter(order => {
                const orderDate = new Date(order.created_at)
                return orderDate >= start && orderDate <= end
              }).length

              return (
                <div key={period.id} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{period.label}:</span>
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Earnings Column */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-4">Earnings</h3>
          <div className="space-y-3">
            {periods.map((period) => {
              const { start, end } = getDateRange(period.id)
              
              const periodB2C = b2cOrders.filter(o => {
                const orderDate = new Date(o.created_at)
                return orderDate >= start && orderDate <= end && o.status === 'delivered'
              })
              
              const periodB2B = b2bOrders.filter(o => {
                const orderDate = new Date(o.created_at)
                return orderDate >= start && orderDate <= end && o.status === 'completed'
              })

              const periodEarnings = 
                periodB2C.reduce((sum, order) => {
                  const orderTotal = order.items?.reduce((itemSum, item) => 
                    itemSum + (item.price_at_purchase * item.quantity), 0) || 0
                  return sum + orderTotal
                }, 0) +
                periodB2B.reduce((sum, order) => sum + order.total_price, 0)

              return (
                <div key={period.id} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{period.label}:</span>
                  <span className="text-sm font-semibold text-gray-900">{formatDZD(periodEarnings)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

