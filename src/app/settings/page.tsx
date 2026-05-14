'use client'

import { useEffect, useState } from 'react'
import { Save, Building2, Shield, Receipt, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getSettings, updateSettings } from '@/lib/actions/settings'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import type { CompanySettings } from '@/lib/types'

const DEFAULT: CompanySettings = {
  name: '',
  email: '',
  phone: '',
  address: '',
  logoUrl: '',
  currency: 'XOF',
  paymentTerms: 30,
  invoicePrefix: 'INV-',
  startingNumber: 1,
  taxRate: 18,
}

type Tab = 'company' | 'billing' | 'security'

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'company', label: 'Entreprise', icon: Building2 },
  { id: 'billing', label: 'Facturation', icon: Receipt },
  { id: 'security', label: 'Sécurité', icon: Shield },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('company')
  const [form, setForm] = useState<CompanySettings>(DEFAULT)
  const [saving, setSaving] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    getSettings()
      .then(setForm)
      .catch(() => toast('Erreur lors du chargement des paramètres.', 'error'))

    createClient()
      .auth.getSession()
      .then(({ data: { session } }) => setUserEmail(session?.user?.email ?? ''))
  }, [])

  const handleChange =
    (field: keyof CompanySettings) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const numeric = ['paymentTerms', 'startingNumber', 'taxRate']
      const value = numeric.includes(field) ? Number(e.target.value) : e.target.value
      setForm(p => ({ ...p, [field]: value }))
    }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSettings(form)
      toast('Paramètres sauvegardés avec succès.')
    } catch {
      toast('Erreur lors de la sauvegarde. Réessayez.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast('Le mot de passe doit contenir au moins 8 caractères.', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      toast('Les mots de passe ne correspondent pas.', 'error')
      return
    }
    setSavingPassword(true)
    try {
      const { error } = await createClient().auth.updateUser({ password: newPassword })
      if (error) throw error
      toast('Mot de passe mis à jour avec succès.')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      toast('Erreur lors du changement de mot de passe.', 'error')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">Paramètres</h1>
          <p className="text-sm text-muted-foreground">Configurez votre compte et vos préférences de facturation.</p>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Entreprise ── */}
        {activeTab === 'company' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Profil de l&apos;entreprise</CardTitle>
                <CardDescription>Ces informations apparaîtront sur vos factures.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 rounded-xl border-2 border-dashed p-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Logo de l&apos;entreprise</p>
                    <p className="text-xs text-muted-foreground">PNG ou JPG, max 2 Mo</p>
                    <Button variant="outline" size="sm" className="mt-2" disabled>
                      Télécharger un logo
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium">Nom de l&apos;entreprise</label>
                    <Input value={form.name} onChange={handleChange('name')} placeholder="Ma Société SARL" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Email professionnel</label>
                    <Input type="email" value={form.email} onChange={handleChange('email')} placeholder="contact@masociete.com" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Téléphone</label>
                    <Input type="tel" value={form.phone} onChange={handleChange('phone')} placeholder="+228 90 00 00 00" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium">Adresse</label>
                    <Input value={form.address} onChange={handleChange('address')} placeholder="Rue des Acaias, Lomé, Togo" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3 pb-6">
              <Button onClick={handleSave} disabled={saving} className="rounded-full px-6">
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
          </>
        )}

        {/* ── Facturation ── */}
        {activeTab === 'billing' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de facturation</CardTitle>
                <CardDescription>Valeurs appliquées automatiquement à vos nouvelles factures.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Devise</label>
                  <select
                    value={form.currency}
                    onChange={handleChange('currency')}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="XOF">XOF — Franc CFA (UEMOA)</option>
                    <option value="XAF">XAF — Franc CFA (CEMAC)</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="USD">USD — Dollar américain</option>
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">TVA (%)</label>
                    <Input type="number" min="0" max="100" value={form.taxRate} onChange={handleChange('taxRate')} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Délai paiement (j)</label>
                    <Input type="number" min="1" max="365" value={form.paymentTerms} onChange={handleChange('paymentTerms')} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">N° de départ</label>
                    <Input type="number" min="1" value={form.startingNumber} onChange={handleChange('startingNumber')} />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Préfixe des factures</label>
                  <Input value={form.invoicePrefix} onChange={handleChange('invoicePrefix')} placeholder="INV-" className="max-w-[160px]" />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3 pb-6">
              <Button onClick={handleSave} disabled={saving} className="rounded-full px-6">
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
          </>
        )}

        {/* ── Sécurité ── */}
        {activeTab === 'security' && (
          <div className="space-y-6 pb-6">
            <Card>
              <CardHeader>
                <CardTitle>Compte</CardTitle>
                <CardDescription>Informations de connexion à votre compte.</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Adresse e-mail</label>
                  <Input value={userEmail} readOnly className="bg-muted/40" />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Pour modifier votre adresse e-mail, contactez le support.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Changer le mot de passe</CardTitle>
                <CardDescription>Choisissez un mot de passe fort d&apos;au moins 8 caractères.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Nouveau mot de passe</label>
                  <div className="relative">
                    <Input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min. 8 caractères"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Confirmer le mot de passe</label>
                  <div className="relative">
                    <Input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={savingPassword || !newPassword}
                  className="rounded-full px-6"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {savingPassword ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
