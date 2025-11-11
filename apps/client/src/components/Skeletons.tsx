// Loading skeleton components for better perceived performance

export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 h-48 w-full rounded-lg loading-skeleton" />
      <div className="mb-2 h-4 w-3/4 rounded loading-skeleton" />
      <div className="mb-2 h-4 w-1/2 rounded loading-skeleton" />
      <div className="h-6 w-1/4 rounded loading-skeleton" />
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function OrderCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="h-4 w-24 rounded loading-skeleton" />
        <div className="h-6 w-16 rounded-full loading-skeleton" />
      </div>
      <div className="mb-2 h-4 w-1/2 rounded loading-skeleton" />
      <div className="mb-2 h-4 w-2/3 rounded loading-skeleton" />
      <div className="h-4 w-1/3 rounded loading-skeleton" />
    </div>
  )
}

export function OrderListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded loading-skeleton" />
        </td>
      ))}
    </tr>
  )
}

export function TableSkeleton({ rows = 10, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="w-full">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <div className="h-4 rounded bg-gray-300" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DashboardCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-2 h-4 w-1/2 rounded loading-skeleton" />
      <div className="mb-4 h-8 w-2/3 rounded loading-skeleton" />
      <div className="h-3 w-1/3 rounded loading-skeleton" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </div>

      {/* Chart area */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 h-6 w-1/4 rounded loading-skeleton" />
        <div className="h-64 w-full rounded loading-skeleton" />
      </div>

      {/* Recent activity */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 h-6 w-1/3 rounded loading-skeleton" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-2/3 rounded loading-skeleton" />
              <div className="h-4 w-1/4 rounded loading-skeleton" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ListingFormSkeleton() {
  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="h-6 w-1/3 rounded loading-skeleton" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="mb-2 h-4 w-1/4 rounded loading-skeleton" />
            <div className="h-10 w-full rounded loading-skeleton" />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <div className="h-10 w-24 rounded loading-skeleton" />
        <div className="h-10 w-24 rounded loading-skeleton" />
      </div>
    </div>
  )
}

export function PageHeaderSkeleton() {
  return (
    <div>
      <div className="mb-2 h-8 w-1/3 rounded loading-skeleton" />
      <div className="h-4 w-1/2 rounded loading-skeleton" />
    </div>
  )
}
