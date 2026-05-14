'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const passwordStrength =
    password.length === 0 ? 0
    : password.length < 8 ? 1
    : password.length < 12 ? 2
    : 3

  const strengthLabel = ['', 'Faible', 'Correct', 'Fort']
  const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-green-500']

  async function handleGoogleSignIn() {
    if (!process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED) {
      setError('La connexion Google n\'est pas encore activée. Utilisez email + mot de passe.')
      return
    }
    setGoogleLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/auth/verify-email')
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Créer un compte</h2>
        <p className="text-sm text-muted-foreground mt-1">Commencez gratuitement, sans carte bancaire.</p>
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="relative flex w-full items-center justify-center gap-3 rounded-xl border h-11 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-60"
      >
        <GoogleIcon />
        {googleLoading ? 'Redirection…' : 'Continuer avec Google'}
        {!process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED && (
          <span className="absolute right-3 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            Bientôt
          </span>
        )}
      </button>

      {/* Separator */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-3 text-xs text-muted-foreground">ou s&apos;inscrire avec un e-mail</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Adresse e-mail</label>
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            required
            autoComplete="email"
            className="h-11"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Mot de passe</label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 8 caractères"
              required
              autoComplete="new-password"
              className="h-11 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength ? strengthColor[passwordStrength] : 'bg-muted'}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{strengthLabel[passwordStrength]}</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Confirmer le mot de passe</label>
          <div className="relative">
            <Input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              className="h-11 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" className="w-full h-11 rounded-xl text-base" disabled={loading}>
          {loading ? 'Création du compte…' : 'Créer mon compte'}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Un e-mail de confirmation vous sera envoyé pour activer votre compte.
        </p>
      </form>

      <p className="text-sm text-center text-muted-foreground">
        Déjà un compte ?{' '}
        <Link href="/auth/login" className="text-primary hover:underline font-medium">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
