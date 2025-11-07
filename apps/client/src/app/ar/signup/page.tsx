"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase, supabaseConfigured } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import AuthLoadingSpinner from "@/components/AuthLoadingSpinner"

function SignupPageInnerArabic() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>("")

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/ar/rooms")
    }
  }, [user, authLoading, router])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent submission if already logged in
    if (user) {
      setStatus("أنت مسجل الدخول بالفعل! جارى إعادة التوجيه...")
      router.replace("/ar/rooms")
      return
    }

    if (!supabase) return
    setSubmitting(true)
    setStatus("جارى إنشاء الحساب...")
    
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/ar/auth/callback`, // Redirect to Arabic callback
        data: {
          email: email,
          full_name: email.split('@')[0], 
        }
      }
    })
    
    if (error) {
      setStatus(`خطأ: ${error.message}`)
      setSubmitting(false)
      return
    }
    
    // Create user profile in database
    if (data.user) {
      try {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: email,
            full_name: email.split('@')[0],
            onboarded: false
          })
        
        if (profileError) {
          console.log('Profile creation note:', profileError.message)
        }
      } catch (err) {
        console.log('Profile creation note:', err)
      }
    }
    
    // Check if email confirmation is required
    if (data.user && !data.session) {
      setStatus("✅ تم إنشاء الحساب! يرجى التحقق من بريدك الإلكتروني للتحقق من حسابك قبل تسجيل الدخول.")
      setSubmitting(false)
    } else if (data.session) {
      setStatus("✅ تم إنشاء الحساب! جارى إعادة التوجيه...")
      setTimeout(() => router.replace("/ar/rooms"), 1500)
    }
  }

  if (!supabaseConfigured) {
    return <div className="p-6 text-sm text-red-600" dir="rtl">لم يتم تهيئة Supabase. قم بتعيين `NEXT_PUBLIC_SUPABASE_URL` و `NEXT_PUBLIC_SUPABASE_ANON_KEY`.</div>
  }

  if (authLoading) {
    return <AuthLoadingSpinner message="جارى التحقق من الجلسة..." />
  }

  if (user) {
    return <AuthLoadingSpinner message="أنت مسجل الدخول بالفعل! جارى إعادة التوجيه..." />
  }

  return (
    <main className="relative" dir="rtl">
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
      <section className="max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-2 text-slate-900">
          <h1 className="text-3xl font-extrabold tracking-tight">أنشئ حسابك في TRAVoices</h1>
          <p className="text-slate-700 text-sm">ابدأ بخطة الآن أو اختر لاحقًا. يمكنك الترقية في أي وقت.</p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white/70 backdrop-blur p-4 text-slate-900">
          <div className="text-xs uppercase tracking-wide text-slate-600 mb-2">اختر خطة البدء</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[ 
              { id: 'creator', label: 'مُنشئ', note: '7 دولارات/شهر' },
              { id: 'pro', label: 'احترافي', note: '29 دولارًا/شهر' },
              { id: 'team', label: 'فريق', note: '79 دولارًا/شهر' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                aria-pressed={selectedPlan === p.id}
                className={`rounded-md border px-3 py-2 text-sm ${selectedPlan === p.id ? 'border-amber-500 bg-white shadow' : 'border-black/15 bg-white/60 hover:bg-white/80'}`}
              >
                <span className="font-semibold">{p.label}</span>
                <span className="mr-2 text-xs text-slate-600">{p.note}</span>
              </button>
            ))}
          </div>
          {selectedPlan && (
            <p className="mt-2 text-xs text-slate-700">المحدد: <span className="font-medium">{selectedPlan}</span>. يمكنك تغيير هذا لاحقًا.</p>
          )}
        </div>

        <div className="rounded-xl border border-black/10 bg-white/70 backdrop-blur p-6 text-slate-900">
          <form onSubmit={handleSignup} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">البريد الإلكتروني</label>
              <input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@example.com"
                className="w-full rounded-md border border-black/20 bg-white/70 p-2 outline-none focus:ring-2 focus:ring-amber-400/50" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="password">كلمة المرور</label>
              <input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="6 أحرف على الأقل"
                minLength={6}
                className="w-full rounded-md border border-black/20 bg-white/70 p-2 outline-none focus:ring-2 focus:ring-amber-400/50" 
                required 
              />
              <p className="mt-1 text-xs text-slate-600">يجب أن تتكون من 6 أحرف على الأقل</p>
            </div>
            <button
              type="submit"
              disabled={submitting || authLoading}
              aria-label="إنشاء حساب"
              className="w-full inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 font-semibold text-slate-900 bg-gradient-to-r from-yellow-400 to-amber-500 shadow hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "جارى إنشاء الحساب..." : "إنشاء حساب"}
            </button>
          </form>
          
          {status && (
            <div className={`mt-4 p-3 rounded-lg ${status.includes("✅") ? "bg-green-50 border border-green-200 text-green-800" : status.includes("❌") || status.includes("Error") ? "bg-red-50 border border-red-200 text-red-800" : "bg-blue-50 border border-blue-200 text-blue-800"}`}>
              <p className="text-sm font-medium" role="status">{status}</p>
              {status.includes("تحقق من بريدك الإلكتروني") && (
                <p className="mt-2 text-xs">
                  📧 تحقق من صندوق الوارد الخاص بك وانقر على رابط التحقق لإكمال تسجيلك.
                </p>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-sm text-slate-800">
          هل لديك حساب بالفعل؟ <a href="/ar/login" className="underline underline-offset-4">تسجيل الدخول</a>
        </p>
      </section>
    </main>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm opacity-70" dir="rtl">جارى التحميل...</div>}>
      <SignupPageInnerArabic />
    </Suspense>
  )
}
