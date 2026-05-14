'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Save, Download } from 'lucide-react'
import Link from 'next/link'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createInvoice, nextInvoiceNumber } from '@/lib/actions/invoices'
import { getCustomers } from '@/lib/actions/customers'
import { getSettings } from '@/lib/actions/settings'
import { formatCurrency } from '@/lib/formatters'
import type { InvoiceItem, Customer } from '@/lib/types'

const TAX_OPTIONS = [
  { key: 'exonere', label: 'Exonéré',      rate: 0    },
  { key: 'tva18',   label: 'TVA',           rate: 18   },
  { key: 'tva20',   label: 'TVA',           rate: 20   },
  { key: 'tps18',   label: 'TPS',           rate: 18   },
  { key: 'css',     label: 'CSS',           rate: 1    },
  { key: 'custom',  label: 'Personnalisée', rate: null },
] as const
type TaxKey = typeof TAX_OPTIONS[number]['key']

function today() {
  return new Date().toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

interface LineItem extends InvoiceItem { _key: string }

const emptyLine = (): LineItem => ({
  _key: uid(), description: '', quantity: 1, unitPrice: 0, total: 0,
})

export default function NewInvoicePage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [invoiceNumber, setInvoiceNumber] = useState('')

  const [customerId, setCustomerId] = useState('')
  const [taxKey, setTaxKey] = useState<TaxKey>('tva18')
  const [taxLabel, setTaxLabel] = useState('TVA')
  const [taxRate, setTaxRate] = useState(18)
  const [date, setDate] = useState(today())
  const [dueDate, setDueDate] = useState(addDays(today(), 30))
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<LineItem[]>([emptyLine()])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([getCustomers(), getSettings(), nextInvoiceNumber()]).then(
      ([c, s, num]) => {
        setCustomers(c)
        setDueDate(addDays(today(), s.paymentTerms || 30))
        const rate = s.taxRate || 18
        const matched = TAX_OPTIONS.find(o => o.rate === rate)
        if (matched) {
          setTaxKey(matched.key)
          setTaxLabel(matched.label)
          setTaxRate(matched.rate)
        } else {
          setTaxKey('custom')
          setTaxLabel('Personnalisée')
          setTaxRate(rate)
        }
        setInvoiceNumber(num)
      }
    ).catch(console.error)
  }, [])

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId]
  )

  const subtotal = lines.reduce((s, l) => s + l.total, 0)
  const tax = Math.round((subtotal * taxRate) / 100)
  const total = subtotal + tax

  const updateLine = (key: string, field: keyof LineItem, raw: string) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l._key !== key) return l
        const u = { ...l }
        if (field === 'description') u.description = raw
        else if (field === 'quantity') u.quantity = Math.max(0, Number(raw) || 0)
        else if (field === 'unitPrice') u.unitPrice = Math.max(0, Number(raw) || 0)
        u.total = u.quantity * u.unitPrice
        return u
      })
    )
  }

  const handleTaxChange = (key: TaxKey) => {
    setTaxKey(key)
    const opt = TAX_OPTIONS.find(o => o.key === key)!
    setTaxLabel(opt.label)
    if (opt.rate !== null) setTaxRate(opt.rate)
  }

  const addLine = () => setLines((p) => [...p, emptyLine()])
  const removeLine = (key: string) =>
    setLines((p) => (p.length > 1 ? p.filter((l) => l._key !== key) : p))

  const handleSubmit = async (status: 'draft' | 'sent', download = false) => {
    if (!invoiceNumber.trim()) { alert('Veuillez saisir un numéro de facture.'); return }
    if (!customerId) { alert('Veuillez sélectionner un client.'); return }
    if (lines.every((l) => !l.description.trim())) { alert('Ajoutez au moins une ligne.'); return }
    setSaving(true)
    try {
      const created = await createInvoice({
        id: invoiceNumber,
        customerId,
        customerName: selectedCustomer?.name ?? '',
        customerCompany: selectedCustomer?.company ?? '',
        customerEmail: selectedCustomer?.email ?? '',
        customerPhone: selectedCustomer?.phone ?? '',
        customerAddress: selectedCustomer?.address ?? '',
        date,
        dueDate,
        subtotal,
        tax,
        taxRate,
        taxLabel,
        amount: total,
        status,
        notes,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        items: lines.map(({ _key: _k, ...rest }) => rest),
      })
      if (download) {
        router.push(`/invoices/${created.id}?print=true`)
      } else {
        router.push('/invoices')
      }
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/invoices"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Nouvelle facture</h1>
              <p className="text-sm text-muted-foreground">N° {invoiceNumber || '—'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />Brouillon
            </Button>
            <Button onClick={() => handleSubmit('sent', true)} disabled={saving} className="rounded-full px-6">
              <Download className="mr-2 h-4 w-4" />Enregistrer
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informations client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Client *</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">— Sélectionner un client —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>
                  ))}
                </select>
              </div>
              {selectedCustomer && (
                <div className="rounded-lg bg-muted/40 p-3 text-sm space-y-0.5 text-muted-foreground">
                  {selectedCustomer.company && <p className="font-medium text-foreground">{selectedCustomer.company}</p>}
                  {selectedCustomer.email && <p>{selectedCustomer.email}</p>}
                  {selectedCustomer.phone && <p>{selectedCustomer.phone}</p>}
                  {selectedCustomer.address && <p>{selectedCustomer.address}</p>}
                </div>
              )}
              {customers.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Aucun client.{' '}
                  <Link href="/customers/new" className="text-primary underline underline-offset-2">
                    Créez-en un d&apos;abord.
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dates & référence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">N° Facture</label>
                <Input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="ex. INV-001"
                  className="font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Date d&apos;émission</label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Date d&apos;échéance</label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Lignes de facture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="hidden md:block">
              <div className="mb-2 grid grid-cols-[1fr_80px_130px_130px_40px] gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span>Description</span>
                <span className="text-center">Qté</span>
                <span className="text-right">Prix unit. HT</span>
                <span className="text-right">Total HT</span>
                <span />
              </div>
              <div className="space-y-2">
                {lines.map((line) => (
                  <div key={line._key} className="grid grid-cols-[1fr_80px_130px_130px_40px] gap-2 items-center">
                    <Input
                      placeholder="Description du service ou produit"
                      value={line.description}
                      onChange={(e) => updateLine(line._key, 'description', e.target.value)}
                    />
                    <Input
                      type="number" min="0" placeholder="1"
                      value={line.quantity || ''}
                      onChange={(e) => updateLine(line._key, 'quantity', e.target.value)}
                      className="text-center"
                    />
                    <Input
                      type="number" min="0" placeholder="0"
                      value={line.unitPrice || ''}
                      onChange={(e) => updateLine(line._key, 'unitPrice', e.target.value)}
                      className="text-right"
                    />
                    <div className="flex h-10 items-center justify-end rounded-lg border bg-muted/40 px-3 text-sm font-medium">
                      {Math.round(line.total).toLocaleString('fr-FR')}
                    </div>
                    <button
                      onClick={() => removeLine(line._key)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 md:hidden">
              {lines.map((line, idx) => (
                <div key={line._key} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Ligne {idx + 1}</span>
                    <button onClick={() => removeLine(line._key)} className="text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <Input
                    placeholder="Description"
                    value={line.description}
                    onChange={(e) => updateLine(line._key, 'description', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Qté</label>
                      <Input type="number" min="0" value={line.quantity || ''}
                        onChange={(e) => updateLine(line._key, 'quantity', e.target.value)} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Prix unit. HT</label>
                      <Input type="number" min="0" value={line.unitPrice || ''}
                        onChange={(e) => updateLine(line._key, 'unitPrice', e.target.value)} />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-muted-foreground">Total HT</span>
                    <span>{Math.round(line.total).toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={addLine} className="mt-4 w-full" size="sm">
              <Plus className="mr-2 h-4 w-4" />Ajouter une ligne
            </Button>

            <div className="mt-6 ml-auto w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total HT</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground shrink-0">Taxe</span>
                <div className="flex items-center gap-2">
                  <select
                    value={taxKey}
                    onChange={(e) => handleTaxChange(e.target.value as TaxKey)}
                    className="h-8 rounded-lg border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {TAX_OPTIONS.map(o => (
                      <option key={o.key} value={o.key}>
                        {o.label}{o.rate !== null ? ` (${o.rate}%)` : ''}
                      </option>
                    ))}
                  </select>
                  {taxKey === 'custom' && (
                    <Input
                      type="number" min="0" max="100"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                      className="h-8 w-20 text-right text-sm"
                    />
                  )}
                  <span className="w-24 text-right font-medium">{formatCurrency(tax)}</span>
                </div>
              </div>
              <div className="flex justify-between rounded-lg bg-primary/5 px-3 py-2 text-base font-bold">
                <span>Total TTC</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notes & conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Conditions de paiement, notes pour le client..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pb-6">
          <Button variant="outline" asChild>
            <Link href="/invoices">Annuler</Link>
          </Button>
          <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />Enregistrer brouillon
          </Button>
          <Button onClick={() => handleSubmit('sent', true)} disabled={saving} className="rounded-full px-6">
            <Download className="mr-2 h-4 w-4" />Enregistrer & télécharger
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
