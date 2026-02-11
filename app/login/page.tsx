"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const GoogleIcon = () => (
  <span className="inline-flex items-center justify-center w-5 h-5 shrink-0">
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
  </span>
)

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess("Check your email to confirm your account.")
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push("/register")
        router.refresh()
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) throw error
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToChoices = () => {
    setShowEmailForm(false)
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 relative overflow-hidden">
      {/* Ambient background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-400/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[url('https://img.freepik.com/free-vector/white-minimal-hexagons-background_79603-1452.jpg')] opacity-[0.03] bg-cover bg-center" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black/20 p-8 md:p-10">
          {/* Logo / Title */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center justify-center mb-4"
            >
              <Image
                src="/logo.png"
                alt="Cabinet Masters"
                width={80}
                height={80}
                className="object-contain"
              />
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Cabinet Masters
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Sign in to access your dashboard
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!showEmailForm ? (
              <motion.div
                key="choices"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <Button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold !rounded-full shadow-lg shadow-indigo-500/25 border-0 gap-3 inline-flex items-center justify-start pl-[8px]"
                >
                  <span className="inline-flex items-center justify-center w-5 h-5 shrink-0">
                    <Mail className="w-5 h-5" strokeWidth={2} />
                  </span>
                  <span>Sign in / Sign up with Email</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full h-14 bg-white/5 border-white/10 hover:bg-white/10 text-white !rounded-full font-medium gap-3 inline-flex items-center justify-start pl-[8px]"
                >
                  <GoogleIcon />
                  <span>Continue with Gmail</span>
                </Button>
              </motion.div>
            ) : (
              <motion.form
                key="email-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleEmailAuth}
                className="space-y-5"
              >
                <button
                  type="button"
                  onClick={handleBackToChoices}
                  className="text-slate-400 hover:text-white text-sm mb-2 flex items-center gap-1 transition-colors"
                >
                  ← Back
                </button>

                <div>
                  <Label htmlFor="email" className="text-slate-300 text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 shrink-0" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:ring-indigo-400/30 mt-0 rounded-2xl"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="text-slate-300 text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 shrink-0" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:ring-indigo-400/30 mt-0 rounded-2xl"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400 text-sm bg-red-500/10 rounded-2xl px-3 py-2"
                  >
                    {error}
                  </motion.p>
                )}
                {success && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-green-400 text-sm bg-green-500/10 rounded-2xl px-3 py-2"
                  >
                    {success}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold !rounded-full shadow-lg shadow-indigo-500/25 border-0 gap-3 inline-flex items-center justify-center"
                >
                  {loading
                    ? isSignUp
                      ? "Creating account..."
                      : "Signing in..."
                    : isSignUp
                      ? "Create account"
                      : "Sign in"}
                  <span className="inline-flex items-center justify-center w-5 h-5 shrink-0">
                    <ArrowRight className="w-5 h-5" strokeWidth={2} />
                  </span>
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError(null)
                    setSuccess(null)
                  }}
                  className="w-full text-center text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          © 2026 Cabinet Masters
        </p>
      </motion.div>
    </div>
  )
}
