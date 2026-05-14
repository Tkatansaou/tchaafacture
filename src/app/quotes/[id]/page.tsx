'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Pencil, Trash2, Save, Send, Plus, FileCheck } from 'lucide-react'
import Link from 'next/link'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getQuote, updateQuote, updateQuoteStatus, deleteQuote, convertQuoteToInvoice } from '@/lib/actions/quotes'
import { getCustomers } from '@/lib/actions/customers'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { Quote, QuoteStatus, InvoiceItem, Customer } from '@/lib/types'

const statusVariant: Record<QuoteStatus, 'outline' | 'secondary' | 'success' | 'danger' | 'warning'> = {
  draft: 'outline', sent: 'secondary', accepted: 'success', rejected: 'danger', expired: 'warning',
}
const statusLabel: Record<QuoteStatus, string> = {
  draft: 'Brouillon', sent: 'Envoyé', accepted: 'Accepté', rejected: 'Refusé', expired: 'Expiré',
}

function uid() { return Math.random().toString(36).slice(2, 10) }
interface LineItem extends InvoiceItem { _key: string }

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [quote, setQuote] = useState<Quote | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [notFound, setNotFound] = useState(false)
  const [editing, setEditing] = useState(false)
  const [converting, setConverting] = useState(false)

  const [customerId, setCustomerId] = useState('')
  const [date, setDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<LineItem[]>([])

  useEffect(() => {
    Promise.all([getQuote(params.id), getCustomers()]).then(([q, c]) => {
      if (!q) { setNotFound(true); return }
      setQuote(q)
      setCustomers(c)
      if (searchParams.get('edit') === 'true') startEditWith(q)
    }).catch(console.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const TAX_RATE = quote?.taxRate ?? 18
  const selectedCustomer = customers.find((c) => c.id === customerId)
  const subtotal = lines.reduce((s, l) => s + l.total, 0)
  const tax = Math.round((subtotal * TAX_RATE) / 100)
  const total = subtotal + tax

  function startEditWith(q: Quote) {
    setCustomerId(q.customerId)
    setDate(q.date)
    setExpiryDate(q.expiryDate)
    setNotes(q.notes)
    setLines(q.items.map((item) => ({ ...item, _key: uid() })))
    setEditing(true)
  }

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

  const handleSave = async (status: 'draft' | 'sent') => {
    if (!quote) return
    const cust = customers.find((c) => c.id === customerId)
    const updated: Quote = {
      ...quote,
      customerId,
      customerName: cust?.name ?? quote.customerName,
      customerCompany: cust?.company ?? quote.customerCompany,
      customerEmail: cust?.email ?? quote.customerEmail,
      customerPhone: cust?.phone ?? quote.customerPhone,
      customerAddress: cust?.address ?? quote.customerAddress,
      date, expiryDate, notes, subtotal, tax,
      taxRate: TAX_RATE, taxLabel: quote.taxLabel, amount: total, status,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      items: lines.map(({ _key: _k, ...rest }) => rest),
    }
    await updateQuote(updated)
    setQuote(updated)
    setEditing(false)
  }

  const handleConvert = async () => {
    if (!quote) return
    if (!confirm('Convertir ce devis en facture ?')) return
    setConverting(true)
    try {
      const invoiceId = await convertQuoteToInvoice(quote.id)
      router.push(`/invoices/${invoiceId}`)
    } catch {
      alert('Erreur lors de la conversion.')
      setConverting(false)
    }
  }

  const handleDelete = async () => {
    if (!quote) return
    if (!confirm('Supprimer définitivement ce devis ?')) return
    await deleteQuote(quote.id)
    router.push('/quotes')
  }

  if (notFound) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-lg font-medium">Devis introuvable</p>
        <Button asChild><Link href="/quotes">Retour aux devis</Link></Button>
      </div>
    </DashboardLayout>
  )

  if (!quote) return (
    <DashboardLayout>
      <div className="flex items-center justify-center py-24 text-muted-foreground">Chargement…</div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/quotes"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{quote.id}</h1>
                <Badge variant={statusVariant[quote.status]}>{statusLabel[quote.status]}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{quote.customerName}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!editing ? (
              <>
                {!quote.convertedToInvoiceId && quote.status !== 'rejected' && (
                  <Button variant="outline" size="sm" onClick={handleConvert} disabled={converting} className="text-green-600 hover:text-green-700">
                    <FileCheck className="mr-2 h-4 w-4" />{converting ? 'Conversion…' : 'Convertir en facture'}
                  </Button>
                )}
                {quote.convertedToInvoiceId && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/invoices/${quote.convertedToInvoiceId}`}>Voir la facture →</Link>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => startEditWith(quote)}>
                  <Pencil className="mr-2 h-4 w-4" />Modifier
                </Button>
                <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />Supprimer
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Annuler</Button>
                <Button variant="outline" size="sm" onClick={() => handleSave('draft')}><Save className="mr-2 h-4 w-4" />Brouillon</Button>
                <Button size="sm" className="rounded-full px-5" onClick={() => handleSave('sent')}><Send className="mr-2 h-4 w-4" />Envoyer</Button>
              </>
            )}
          </div>
        </div>

        {!editing && (
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Changer le statut :</span>
                {(['draft', 'sent', 'accepted', 'rejected', 'expired'] as QuoteStatus[]).map((s) => (
                  <button key={s} onClick={() => { updateQuoteStatus(quote.id, s); setQuote({ ...quote, status: s }) }}
                    className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                      quote.status === s ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background text-muted-foreground hover:border-primary hover:text-primary'
                    }`}>
                    {statusLabel[s]}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!editing && (
          <Card>
            <CardContent className="p-6 md:p-10">
              <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
                <div>
                  <p className="text-2xl font-extrabold tracking-tight text-primary">DEVIS</p>
                  <p className="font-mono text-sm font-semibold text-muted-foreground">{quote.id}</p>
                </div>
                <div className="sm:text-right space-y-1">
                  <p className="text-sm text-muted-foreground">Date : {formatDate(quote.date)}</p>
                  <p className="text-sm text-muted-foreground">Expiration : {formatDate(quote.expiryDate)}</p>
                </div>
              </div>

              <hr className="my-6" />

              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Destinataire</p>
                <p className="font-semibold">{quote.customerName}</p>
                <div className="mt-0.5 space-y-0.5 text-sm text-muted-foreground">
                  {quote.customerCompany && <p>{quote.customerCompany}</p>}
                  {quote.customerEmail && <p>{quote.customerEmail}</p>}
                  {quote.customerPhone && <p>{quote.customerPhone}</p>}
                  {quote.customerAddress && <p>{quote.customerAddress}</p>}
                </div>
              </div>

              <hr className="my-6" />

              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                      <th className="pb-3 pr-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground w-14">Qté</th>
                      <th className="pb-3 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground w-32">Prix unit. HT</th>
                      <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground w-32">Total HT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {quote.items.map((item, i) => (
                      <tr key={i}>
                        <td className="py-3 pr-4">{item.description}</td>
                        <td className="py-3 pr-4 text-center text-muted-foreground">{item.quantity}</td>
                        <td className="py-3 pr-4 text-right text-muted-foreground">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 ml-auto w-full max-w-xs space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total HT</span>
                  <span>{formatCurrency(quote.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{quote.taxLabel}{quote.taxRate > 0 ? ` ${quote.taxRate}%` : ''}</span>
                  <span>{formatCurrency(quote.tax)}</span>
                </div>
                <div className="flex justify-between rounded-lg bg-primary/5 px-3 py-2.5 text-base font-bold">
                  <span>Total TTC</span>
                  <span className="text-primary">{formatCurrency(quote.amount)}</span>
                </div>
              </div>

              {quote.notes && (
                <div className="mt-6 rounded-lg bg-muted/40 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
                  <p className="text-sm">{quote.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {editing && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="p-5 space-y-3">
                  <p className="font-semibold">Client</p>
                  <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="">— Sélectionner un client —</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>
                    ))}
                  </select>
                  {selectedCustomer && (
                    <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground space-y-0.5">
                      {selectedCustomer.company && <p className="font-medium text-foreground">{selectedCustomer.company}</p>}
                      {selectedCustomer.email && <p>{selectedCustomer.email}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 space-y-3">
                  <p className="font-semibold">Dates</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="mb-1.5 block text-sm font-medium">Date d&apos;émission</label>
                      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                    <div><label className="mb-1.5 block text-sm font-medium">Expiration</label>
                      <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} /></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-5">
                <p className="mb-4 font-semibold">Lignes</p>
                <div className="hidden md:block">
                  <div className="mb-2 grid grid-cols-[1fr_80px_130px_130px_40px] gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <span>Description</span><span className="text-center">Qté</span>
                    <span className="text-right">Prix HT</span><span className="text-right">Total HT</span><span />
                  </div>
                  <div className="space-y-2">
                    {lines.map((line) => (
                      <div key={line._key} className="grid grid-cols-[1fr_80px_130px_130px_40px] gap-2 items-center">
                        <Input value={line.description} onChange={(e) => updateLine(line._key, 'description', e.target.value)} />
                        <Input type="number" min="0" value={line.quantity || ''} onChange={(e) => updateLine(line._key, 'quantity', e.target.value)} className="text-center" />
                        <Input type="number" min="0" value={line.unitPrice || ''} onChange={(e) => updateLine(line._key, 'unitPrice', e.target.value)} className="text-right" />
                        <div className="flex h-10 items-center justify-end rounded-lg border bg-muted/40 px-3 text-sm font-medium">
                          {Math.round(line.total).toLocaleString('fr-FR')}
                        </div>
                        <button onClick={() => setLines(p => p.length > 1 ? p.filter(l => l._key !== line._key) : p)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <Button variant="outline" onClick={() => setLines(p => [...p, { _key: uid(), description: '', quantity: 1, unitPrice: 0, total: 0 }])}
                  className="mt-4 w-full" size="sm">
                  <Plus className="mr-2 h-4 w-4" />Ajouter une ligne
                </Button>
                <div className="mt-6 ml-auto w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total HT</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{quote.taxLabel} {TAX_RATE > 0 ? `${TAX_RATE}%` : ''}</span>
                    <span className="font-medium">{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-primary/5 px-3 py-2 font-bold">
                    <span>Total TTC</span><span className="text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="mb-3 font-semibold">Notes</p>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pb-6">
              <Button variant="outline" onClick={() => setEditing(false)}>Annuler</Button>
              <Button variant="outline" onClick={() => handleSave('draft')}><Save className="mr-2 h-4 w-4" />Brouillon</Button>
              <Button className="rounded-full px-6" onClick={() => handleSave('sent')}><Send className="mr-2 h-4 w-4" />Envoyer</Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
