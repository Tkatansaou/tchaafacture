'use client'

import { useEffect, useState } from 'react'
import { Save, Check, Building2 } from 'lucide-react'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getSettings, updateSettings } from '@/lib/actions/settings'
import type { CompanySettings } from '@/lib/types'

const DEFAULT: CompanySettings = {
  name: 'Ma Société',
  email: 'contact@masociete.com',
  phone: '+228 90 00 00 00',
  address: 'Lomé, Togo',
  logoUrl: '',
  currency: 'XOF',
  paymentTerms: 30,
  invoicePrefix: 'INV-',
  startingNumber: 1,
  taxRate: 18,
}

export default function SettingsPage() {
  const [form, setForm] = useState<CompanySettings>(DEFAULT)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSettings().then(setForm).catch(console.error)
  }, [])

  const handleChange =
    (field: keyof CompanySettings) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value =
        field === 'paymentTerms' || field === 'startingNumber' || field === 'taxRate'
          ? Number(e.target.value)
          : e.target.value
      setForm((p) => ({ ...p, [field]: value }))
    }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSettings(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">Paramètres</h1>
          <p className="text-sm text-muted-foreground">Configurez votre entreprise et vos préférences de facturation.</p>
        </div>

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
                <label className="mb-1.5 block text-sm font-medium">Email</label>
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
                <Input
                  type="number" min="0" max="100"
                  value={form.taxRate}
                  onChange={handleChange('taxRate')}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Délai paiement (jours)</label>
                <Input
                  type="number" min="1" max="365"
                  value={form.paymentTerms}
                  onChange={handleChange('paymentTerms')}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">N° de départ</label>
                <Input
                  type="number" min="1"
                  value={form.startingNumber}
                  onChange={handleChange('startingNumber')}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Préfixe des factures</label>
              <Input
                value={form.invoicePrefix}
                onChange={handleChange('invoicePrefix')}
                placeholder="INV-"
                className="max-w-[160px]"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 pb-6">
          <Button onClick={handleSave} disabled={saving} className="rounded-full px-6">
            {saved ? (
              <><Check className="mr-2 h-4 w-4" />Sauvegardé !</>
            ) : (
              <><Save className="mr-2 h-4 w-4" />{saving ? 'Enregistrement…' : 'Enregistrer'}</>
            )}
          </Button>
          {saved && <p className="text-sm font-medium text-green-600">Paramètres mis à jour avec succès.</p>}
        </div>
      </div>
    </DashboardLayout>
  )
}
