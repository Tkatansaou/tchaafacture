'use client'

import { useState } from "react"
import { Save, Check } from "lucide-react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface FormData {
  companyName: string
  email: string
  phone: string
  address: string
  currency: string
  paymentTerms: string
  invoicePrefix: string
  startingNumber: string
}

const initialFormData: FormData = {
  companyName: 'Ma Société',
  email: 'contact@masociete.com',
  phone: '+228 90 00 00 00',
  address: 'Lomé, Togo',
  currency: 'XOF',
  paymentTerms: '30',
  invoicePrefix: 'INV-',
  startingNumber: '021',
}

export default function SettingsPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [saved, setSaved] = useState(false)

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground">Configurez votre compte et vos préférences de facturation.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profil de l&apos;entreprise</CardTitle>
            <CardDescription>Ces informations apparaîtront sur vos factures.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom de l&apos;entreprise</label>
              <Input
                value={formData.companyName}
                onChange={handleChange('companyName')}
                placeholder="Ma Société SARL"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                placeholder="contact@masociete.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Téléphone</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={handleChange('phone')}
                placeholder="+228 90 00 00 00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Adresse</label>
              <Input
                value={formData.address}
                onChange={handleChange('address')}
                placeholder="Ville, Pays"
              />
            </div>

            <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">Logo de l&apos;entreprise</p>
              <p className="mt-1 text-xs text-muted-foreground">Cliquez pour télécharger (PNG, JPG — max 2 Mo)</p>
              <Button variant="outline" size="sm" className="mt-3" disabled>
                Choisir un fichier
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paramètres de facturation</CardTitle>
            <CardDescription>Configurez les valeurs par défaut pour vos nouvelles factures.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Devise</label>
              <select
                value={formData.currency}
                onChange={handleChange('currency')}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="XOF">XOF — Franc CFA (UEMOA)</option>
                <option value="XAF">XAF — Franc CFA (CEMAC)</option>
                <option value="EUR">EUR — Euro</option>
                <option value="USD">USD — Dollar américain</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Délai de paiement par défaut (jours)</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={formData.paymentTerms}
                  onChange={handleChange('paymentTerms')}
                  className="w-32"
                  min="1"
                  max="365"
                />
                <span className="text-sm text-muted-foreground">jours</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Préfixe des factures</label>
                <Input
                  value={formData.invoicePrefix}
                  onChange={handleChange('invoicePrefix')}
                  placeholder="INV-"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Numéro de départ</label>
                <Input
                  type="number"
                  value={formData.startingNumber}
                  onChange={handleChange('startingNumber')}
                  placeholder="001"
                  min="1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} className="rounded-full px-6">
            {saved ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Sauvegardé !
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les modifications
              </>
            )}
          </Button>
          {saved && (
            <p className="text-sm text-green-600 font-medium">
              Vos paramètres ont été enregistrés.
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
