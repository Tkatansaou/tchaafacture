'use client'

import { useEffect, useState } from 'react'
import { Search, Plus, Mail, Phone, FileText, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Modal } from '@/components/ui/modal'
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/lib/actions/customers'
import { formatCurrency } from '@/lib/formatters'
import type { Customer } from '@/lib/types'

type FormData = {
  name: string
  email: string
  phone: string
  company: string
  address: string
}

const emptyForm = (): FormData => ({ name: '', email: '', phone: '', company: '', address: '' })

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm())
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const data = await getCustomers()
      setCustomers(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = customers.filter((c) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q)
    )
  })

  const openEdit = (c: Customer) => {
    setEditing(c)
    setForm({ name: c.name, email: c.email, phone: c.phone, company: c.company, address: c.address })
    setErrors({})
    setModalOpen(true)
  }

  const validate = (): boolean => {
    const e: Partial<FormData> = {}
    if (!form.name.trim()) e.name = 'Le nom est requis'
    if (!form.email.trim()) e.email = "L'email est requis"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (editing) {
        await updateCustomer({ ...editing, ...form })
      } else {
        await createCustomer({
          ...form,
          avatarSeed: form.name.split(' ')[0] || form.name,
        })
      }
      await load()
      setModalOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce client ? Ses factures ne seront pas supprimées.')) return
    try {
      await deleteCustomer(id)
      setCustomers((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const field = (key: keyof FormData, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <Input
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        className={errors[key] ? 'border-red-400' : ''}
      />
      {errors[key] && <p className="mt-1 text-xs text-red-500">{errors[key]}</p>}
    </div>
  )

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Clients</h1>
            <p className="text-sm text-muted-foreground">{customers.length} clients enregistrés</p>
          </div>
          <Button className="rounded-full px-4 md:px-6" asChild>
            <Link href="/customers/new">
              <Plus className="mr-0 h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Nouveau client</span>
            </Link>
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Nom, email ou entreprise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            {searchQuery ? 'Aucun client ne correspond à votre recherche.' : 'Aucun client. Créez-en un !'}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((customer) => (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.avatarSeed}`}
                        alt={customer.name}
                      />
                      <AvatarFallback className="text-sm font-semibold">
                        {customer.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{customer.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{customer.company}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(customer)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{customer.phone}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      <span>{customer.totalInvoices} facture{customer.totalInvoices !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {formatCurrency(customer.totalAmount)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier le client' : 'Nouveau client'}
      >
        <div className="space-y-4">
          {field('name', 'Nom complet *', 'text', 'Jean Dupont')}
          {field('company', 'Entreprise', 'text', 'Ma Société SARL')}
          {field('email', 'Email *', 'email', 'jean@exemple.com')}
          {field('phone', 'Téléphone', 'tel', '+228 90 00 00 00')}
          {field('address', 'Adresse', 'text', 'Rue des Acaias, Lomé')}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-full px-6">
              {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer le client'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
