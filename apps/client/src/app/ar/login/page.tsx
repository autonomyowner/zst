"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase, supabaseConfigured } from "@/lib/supabase"
import { useAuth } from "@/contexts/OptimizedAuthContext"
import AuthLoadingSpinner from "@/components/AuthLoadingSpinner"

function LoginBodyArabic() {
  const router = useRouter()
  const params = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [showResendOption, setShowResendOption] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      const redirect = params.get("redirect") || "/ar"
      router.replace(redirect)
    }
  }, [user, authLoading, router, params])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent submission if already logged in
    if (user) {
      setStatus("أنت مسجل الدخول بالفعل! جارى إعادة التوجيه...")
      const redirect = params.get("redirect") || "/ar"
      router.replace(redirect)
      return
    }

    if (!supabase) return
    setSubmitting(true)
    setStatus("جارى تسجيل الدخول...")
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    setSubmitting(false)
    
    if (error) {
      if (error.message.includes("Invalid login credentials") || error.message.includes("Invalid")) {
        setStatus("❌ البريد الإلكتروني أو كلمة المرور غير صحيحة. إذا قمت بالتسجيل للتو، يرجى التحقق من بريدك الإلكتروني أولاً بالنقر على الرابط المرسل إلى صندوق الوارد الخاص بك.")
        setShowResendOption(true)
      } else if (error.message.includes("Email not confirmed")) {
        setStatus("⚠️ يرجى التحقق من عنوان بريدك الإلكتروني قبل تسجيل الدخول. تحقق من صندوق الوارد الخاص بك بحثًا عن رابط التأكيد.")
        setShowResendOption(true)
      } else {
        setStatus(`خطأ: ${error.message}`)
      }
    } else if (data.session) {
      setStatus("✅ نجاح! جارى إعادة التوجيه...")
      const redirect = params.get("redirect") || "/ar"
      setTimeout(() => {
        window.location.href = redirect
      }, 500)
    }
  }

  const handleOAuth = async (provider: "google" | "github") => {
    if (user) {
      const redirect = params.get("redirect") || "/ar"
      router.replace(redirect)
      return
    }
    
    if (!supabase) return
    setSubmitting(true)
    setStatus(`جارى إعادة التوجيه إلى ${provider}…`)
    const { error } = await supabase.auth.signInWithOAuth({ provider })
    if (error) {
      setStatus(`خطأ: ${error.message}`)
      setSubmitting(false)
    }
  }

  const handleResendVerification = async () => {
    if (!supabase || !email) {
      setStatus("❌ يرجى إدخال عنوان بريدك الإلكتروني أولاً")
      return
    }
    setStatus("جارى إرسال بريد التحقق...")
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })
    if (error) {
      setStatus(`❌ خطأ: ${error.message}`)
    } else {
      setStatus("✅ تم إرسال بريد التحقق! يرجى التحقق من صندوق الوارد والمجلد غير الهام.")
      setShowResendOption(false)
    }
  }

  if (!supabaseConfigured) {
    return (
      <div className="p-6 text-sm text-red-600" dir="rtl">لم يتم تهيئة Supabase. قم بتعيين `NEXT_PUBLIC_SUPABASE_URL` و `NEXT_PUBLIC_SUPABASE_ANON_KEY`.</div>
    )
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
      <section className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2 text-slate-900">
          <h1 className="text-3xl font-extrabold tracking-tight">مرحباً بعودتك</h1>
          <p className="text-slate-700 text-sm">سجل الدخول باستخدام بريدك الإلكتروني وكلمة المرور أو تابع باستخدام مزودك المفضل.</p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white/70 backdrop-blur p-6 text-slate-900">
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
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
              <label htmlFor="password" className="block text-sm font-medium mb-1">كلمة المرور</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الخاصة بك"
                className="w-full rounded-md border border-black/20 bg-white/70 p-2 outline-none focus:ring-2 focus:ring-amber-400/50"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting || authLoading}
              aria-label="تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور"
              className="w-full inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 font-semibold text-slate-900 bg-gradient-to-r from-yellow-400 to-amber-500 shadow hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "جارى تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-slate-600">
            <div className="h-px flex-1 bg-black/10" />
            <span className="text-xs">أو</span>
            <div className="h-px flex-1 bg-black/10" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleOAuth("google")}
              disabled={submitting || authLoading || !!user}
              aria-label="المتابعة باستخدام جوجل"
              className="rounded-md border border-black/15 bg-white/60 px-3 py-2 text-sm hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              جوجل
            </button>
            <button
              onClick={() => handleOAuth("github")}
              disabled={submitting || authLoading || !!user}
              aria-label="المتابعة باستخدام جيت هاب"
              className="rounded-md border border-black/15 bg-white/60 px-3 py-2 text-sm hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              جيت هاب
            </button>
          </div>

          {status && (
            <div className={`mt-4 p-3 rounded-lg ${status.includes("✅") || status.includes("Success") ? "bg-green-50 border border-green-200 text-green-800" : status.includes("❌") || status.includes("Invalid") ? "bg-red-50 border border-red-200 text-red-800" : status.includes("⚠️") || status.includes("verify") ? "bg-yellow-50 border border-yellow-200 text-yellow-800" : "bg-blue-50 border border-blue-200 text-blue-800"}`}>
              <p className="text-sm font-medium" role="status">{status}</p>
              {status.includes("يرجى التحقق من بريدك الإلكتروني") && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs">
                    📧 تحتاج إلى التحقق من بريدك الإلكتروني قبل تسجيل الدخول. تحقق من صندوق الوارد الخاص بك بحثًا عن رابط التأكيد.
                  </p>
                  <p className="text-xs">
                    💡 لم تستلمه؟ تحقق من مجلد البريد العشوائي أو حاول التسجيل مرة أخرى.
                  </p>
                </div>
              )}
              {showResendOption && (
                <button
                  onClick={handleResendVerification}
                  type="button"
                  className="mt-2 text-xs underline underline-offset-2 hover:text-blue-600"
                >
                  إعادة إرسال بريد التحقق
                </button>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-sm text-slate-800">
          جديد هنا؟ <a href="/ar/signup" className="underline underline-offset-4">إنشاء حساب</a>
        </p>
      </section>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm opacity-70" dir="rtl">جارى التحميل...</div>}>
      <LoginBodyArabic />
    </Suspense>
  )
}
