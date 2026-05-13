'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, User } from 'lucide-react'
import Link from 'next/link'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createCustomer } from '@/lib/actions/customers'

interface FormData {
  name: string
  company: string
  email: string
  phone: string
  address: string
  notes: string
}

const empty = (): FormData => ({
  name: '', company: '', email: '', phone: '', address: '', notes: '',
})

export default function NewCustomerPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(empty())
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [saving, setSaving] = useState(false)

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((p) => ({ ...p, [field]: e.target.value }))

  const validate = (): boolean => {
    const e: Partial<FormData> = {}
    if (!form.name.trim()) e.name = 'Le nom est requis'
    if (!form.email.trim()) e.email = "L'email est requis"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await createCustomer({
        name: form.name.trim(),
        company: form.company.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        avatarSeed: form.name.split(' ')[0] || form.name,
      })
      router.push('/customers')
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  const field = (
    key: keyof FormData,
    label: string,
    type = 'text',
    placeholder = '',
    required = false
  ) => (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <Input
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={set(key)}
        className={errors[key] ? 'border-red-400 focus-visible:ring-red-400' : ''}
      />
      {errors[key] && <p className="mt-1 text-xs text-red-500">{errors[key]}</p>}
    </div>
  )

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/customers"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Nouveau client</h1>
            <p className="text-sm text-muted-foreground">Remplissez les informations du client</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            {form.name ? (
              <span className="text-lg font-bold">
                {form.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            ) : (
              <User className="h-6 w-6" />
            )}
          </div>
          <div>
            <p className="font-semibold">{form.name || 'Nom du client'}</p>
            <p className="text-sm text-muted-foreground">{form.company || 'Entreprise'}</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Identité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {field('name', 'Nom complet', 'text', 'Ex : Jean Martin', true)}
            {field('company', 'Entreprise / Société', 'text', 'Ex : Ma Société SARL')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {field('email', 'Adresse email', 'email', 'jean@exemple.com', true)}
            {field('phone', 'Téléphone', 'tel', '+228 90 00 00 00')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Adresse</CardTitle>
          </CardHeader>
          <CardContent>
            {field('address', 'Adresse complète', 'text', 'Rue, Ville, Pays')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notes internes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Informations supplémentaires sur ce client (facultatif)..."
              value={form.notes}
              onChange={set('notes')}
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pb-6">
          <Button variant="outline" asChild>
            <Link href="/customers">Annuler</Link>
          </Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-full px-6">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Enregistrement…' : 'Enregistrer le client'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
