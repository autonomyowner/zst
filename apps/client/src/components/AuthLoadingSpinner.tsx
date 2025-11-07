"use client"

export default function AuthLoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <main className="relative min-h-screen flex items-center justify-center">
      <div
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{
          backgroundColor: '#fff8dc',
          backgroundImage: 'radial-gradient(rgba(201,162,39,0.6) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          backgroundPosition: '0 0',
        }}
      />
      <div className="rounded-xl border border-black/10 bg-white/70 backdrop-blur p-6 text-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          <p className="text-sm opacity-70">{message}</p>
        </div>
      </div>
    </main>
  )
}











