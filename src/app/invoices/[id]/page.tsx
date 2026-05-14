'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Pencil, Trash2, Save, Send, Plus, Printer, Download, Mail } from 'lucide-react'
import Link from 'next/link'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getInvoice, updateInvoice, updateInvoiceStatus, deleteInvoice } from '@/lib/actions/invoices'
import { sendInvoiceEmail } from '@/lib/actions/email'
import { getPayments, addPayment, deletePayment } from '@/lib/actions/payments'
import { getCustomers } from '@/lib/actions/customers'
import { getSettings } from '@/lib/actions/settings'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { Invoice, InvoiceStatus, InvoiceItem, Customer, CompanySettings, Payment } from '@/lib/types'

const statusVariant: Record<InvoiceStatus, 'outline' | 'secondary' | 'success' | 'danger'> = {
  draft: 'outline', sent: 'secondary', paid: 'success', overdue: 'danger',
}
const statusLabel: Record<InvoiceStatus, string> = {
  draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', overdue: 'En retard',
}

function uid() { return Math.random().toString(36).slice(2, 10) }
interface LineItem extends InvoiceItem { _key: string }

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [editing, setEditing] = useState(false)
  const [sending, setSending] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])
  const [payMethod, setPayMethod] = useState('')
  const [payRef, setPayRef] = useState('')
  const [savingPayment, setSavingPayment] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [date, setDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<LineItem[]>([])

  useEffect(() => {
    Promise.all([getInvoice(params.id), getCustomers(), getSettings(), getPayments(params.id)]).then(([inv, c, s, p]) => {
      if (!inv) { setNotFound(true); return }
      setInvoice(inv)
      setCustomers(c)
      setSettings(s)
      setPayments(p)
      if (searchParams.get('edit') === 'true') startEditWith(inv)
    }).catch(console.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  useEffect(() => {
    if (searchParams.get('print') === 'true' && invoice) {
      const timer = setTimeout(() => {
        window.print()
        router.replace(`/invoices/${params.id}`)
      }, 600)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice])

  const TAX_RATE = invoice?.taxRate ?? 18

  const selectedCustomer = customers.find((c) => c.id === customerId)
  const subtotal = lines.reduce((s, l) => s + l.total, 0)
  const tax = Math.round((subtotal * TAX_RATE) / 100)
  const total = subtotal + tax

  function startEditWith(inv: Invoice) {
    setCustomerId(inv.customerId)
    setDate(inv.date)
    setDueDate(inv.dueDate)
    setNotes(inv.notes)
    setLines(inv.items.map((item) => ({ ...item, _key: uid() })))
    setEditing(true)
  }

  const startEdit = () => { if (invoice) startEditWith(invoice) }

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

  const removeLine = (key: string) =>
    setLines((p) => (p.length > 1 ? p.filter((l) => l._key !== key) : p))

  const handleSave = async (status: 'draft' | 'sent') => {
    if (!invoice) return
    if (!customerId) { alert('Veuillez sélectionner un client.'); return }
    const cust = customers.find((c) => c.id === customerId)
    const updated: Invoice = {
      ...invoice,
      customerId,
      customerName: cust?.name ?? invoice.customerName,
      customerCompany: cust?.company ?? invoice.customerCompany,
      customerEmail: cust?.email ?? invoice.customerEmail,
      customerPhone: cust?.phone ?? invoice.customerPhone,
      customerAddress: cust?.address ?? invoice.customerAddress,
      date, dueDate, notes, subtotal, tax,
      taxRate: TAX_RATE, taxLabel: invoice.taxLabel, amount: total, status,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      items: lines.map(({ _key: _k, ...rest }) => rest),
    }
    await updateInvoice(updated)
    setInvoice(updated)
    setEditing(false)
  }

  const changeStatus = async (status: InvoiceStatus) => {
    if (!invoice) return
    await updateInvoiceStatus(invoice.id, status)
    setInvoice({ ...invoice, status })
  }

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const amountDue = invoice ? invoice.amount - totalPaid : 0

  const handleAddPayment = async () => {
    if (!invoice) return
    const amount = Math.round(Number(payAmount))
    if (!amount || amount <= 0) { alert('Montant invalide.'); return }
    setSavingPayment(true)
    const newPayment = await addPayment(invoice.id, { amount, date: payDate, method: payMethod, reference: payRef, notes: '' })
    setPayments((prev) => [...prev, newPayment])
    if (totalPaid + amount >= invoice.amount) setInvoice({ ...invoice, status: 'paid' })
    setPayAmount('')
    setPayRef('')
    setPayMethod('')
    setShowPaymentForm(false)
    setSavingPayment(false)
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!invoice) return
    if (!confirm('Supprimer ce paiement ?')) return
    await deletePayment(paymentId, invoice.id)
    const remaining = payments.filter((p) => p.id !== paymentId)
    setPayments(remaining)
    const newTotal = remaining.reduce((s, p) => s + p.amount, 0)
    if (invoice.status === 'paid' && newTotal < invoice.amount) setInvoice({ ...invoice, status: 'sent' })
  }

  const handleSendEmail = async () => {
    if (!invoice) return
    setSending(true)
    const result = await sendInvoiceEmail(invoice.id)
    setSending(false)
    if (result.success) {
      alert('Email envoyé avec succès !')
    } else {
      alert(`Erreur : ${result.error}`)
    }
  }

  const handleDelete = async () => {
    if (!invoice) return
    if (!confirm('Supprimer définitivement cette facture ?')) return
    await deleteInvoice(invoice.id)
    router.push('/invoices')
  }

  if (notFound) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-lg font-medium">Facture introuvable</p>
          <p className="text-sm text-muted-foreground">La facture {params.id} n&apos;existe pas.</p>
          <Button asChild><Link href="/invoices">Retour aux factures</Link></Button>
        </div>
      </DashboardLayout>
    )
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          Chargement…
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-5">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/invoices"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{invoice.id}</h1>
                <Badge variant={statusVariant[invoice.status]}>{statusLabel[invoice.status]}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{invoice.customerName}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!editing ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/api/invoices/${invoice.id}/pdf`} download>
                    <Download className="mr-2 h-4 w-4" />PDF
                  </a>
                </Button>
                {invoice.customerEmail && (
                  <Button variant="outline" size="sm" onClick={handleSendEmail} disabled={sending}>
                    <Mail className="mr-2 h-4 w-4" />{sending ? 'Envoi…' : 'Email'}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />Imprimer
                </Button>
                <Button variant="outline" size="sm" onClick={startEdit}>
                  <Pencil className="mr-2 h-4 w-4" />Modifier
                </Button>
                <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />Supprimer
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Annuler</Button>
                <Button variant="outline" size="sm" onClick={() => handleSave('draft')}>
                  <Save className="mr-2 h-4 w-4" />Brouillon
                </Button>
                <Button size="sm" className="rounded-full px-5" onClick={() => handleSave('sent')}>
                  <Send className="mr-2 h-4 w-4" />Envoyer
                </Button>
              </>
            )}
          </div>
        </div>

        {!editing && (
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Changer le statut :</span>
                {(['draft', 'sent', 'paid', 'overdue'] as InvoiceStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => changeStatus(s)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                      invoice.status === s
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background text-muted-foreground hover:border-primary hover:text-primary'
                    }`}
                  >
                    {statusLabel[s]}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!editing && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Paiements reçus</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(totalPaid)} payé · {amountDue > 0 ? `${formatCurrency(amountDue)} restant` : 'Soldé'}
                  </p>
                </div>
                {amountDue > 0 && (
                  <Button size="sm" variant="outline" onClick={() => setShowPaymentForm((v) => !v)}>
                    <Plus className="mr-2 h-4 w-4" />Ajouter un paiement
                  </Button>
                )}
              </div>

              {payments.length > 0 && (
                <div className="divide-y rounded-lg border text-sm">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div>
                        <span className="font-semibold">{formatCurrency(p.amount)}</span>
                        {p.method && <span className="ml-2 text-muted-foreground">· {p.method}</span>}
                        {p.reference && <span className="ml-1 text-muted-foreground">#{p.reference}</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">{formatDate(p.date)}</span>
                        <button onClick={() => handleDeletePayment(p.id)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showPaymentForm && (
                <div className="grid grid-cols-2 gap-3 rounded-lg border p-4 sm:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium">Montant (FCFA)</label>
                    <Input type="number" min="0" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Date</label>
                    <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Mode</label>
                    <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="">—</option>
                      <option>Virement</option><option>Espèces</option>
                      <option>Mobile Money</option><option>Chèque</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Référence</label>
                    <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="ex. REF-001" />
                  </div>
                  <div className="col-span-2 flex gap-2 sm:col-span-4">
                    <Button size="sm" onClick={handleAddPayment} disabled={savingPayment}>
                      {savingPayment ? 'Enregistrement…' : 'Enregistrer le paiement'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowPaymentForm(false)}>Annuler</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!editing && (
          <Card className="print:shadow-none print:border-none">
            <CardContent className="p-6 md:p-10">
              <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
                <div>
                  <p className="text-xl font-bold text-primary">{settings?.name || 'Mon Entreprise'}</p>
                  {settings?.email && <p className="text-sm text-muted-foreground">{settings.email}</p>}
                  {settings?.phone && <p className="text-sm text-muted-foreground">{settings.phone}</p>}
                  {settings?.address && <p className="text-sm text-muted-foreground">{settings.address}</p>}
                </div>
                <div className="sm:text-right space-y-1">
                  <p className="text-2xl font-extrabold tracking-tight">FACTURE</p>
                  <p className="font-mono text-sm font-semibold text-muted-foreground">{invoice.id}</p>
                  <p className="text-sm text-muted-foreground">Date : {formatDate(invoice.date)}</p>
                  <p className="text-sm text-muted-foreground">Échéance : {formatDate(invoice.dueDate)}</p>
                </div>
              </div>

              <hr className="my-6" />

              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Facturer à
                </p>
                <p className="font-semibold">{invoice.customerName}</p>
                <div className="mt-0.5 space-y-0.5 text-sm text-muted-foreground">
                  {invoice.customerCompany && <p>{invoice.customerCompany}</p>}
                  {invoice.customerEmail && <p>{invoice.customerEmail}</p>}
                  {invoice.customerPhone && <p>{invoice.customerPhone}</p>}
                  {invoice.customerAddress && <p>{invoice.customerAddress}</p>}
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
                    {invoice.items.map((item, i) => (
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
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {invoice.taxLabel}{invoice.taxRate > 0 ? ` ${invoice.taxRate}%` : ''}
                  </span>
                  <span>{formatCurrency(invoice.tax)}</span>
                </div>
                <div className="flex justify-between rounded-lg bg-primary/5 px-3 py-2.5 text-base font-bold">
                  <span>Total TTC</span>
                  <span className="text-primary">{formatCurrency(invoice.amount)}</span>
                </div>
              </div>

              {invoice.notes && (
                <div className="mt-6 rounded-lg bg-muted/40 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
                  <p className="text-sm">{invoice.notes}</p>
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
                  {selectedCustomer && (
                    <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground space-y-0.5">
                      {selectedCustomer.company && <p className="font-medium text-foreground">{selectedCustomer.company}</p>}
                      {selectedCustomer.email && <p>{selectedCustomer.email}</p>}
                      {selectedCustomer.address && <p>{selectedCustomer.address}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 space-y-3">
                  <p className="font-semibold">Dates</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Date d&apos;émission</label>
                      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Échéance</label>
                      <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-5">
                <p className="mb-4 font-semibold">Lignes de facture</p>

                <div className="hidden md:block">
                  <div className="mb-2 grid grid-cols-[1fr_80px_130px_130px_40px] gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <span>Description</span>
                    <span className="text-center">Qté</span>
                    <span className="text-right">Prix HT</span>
                    <span className="text-right">Total HT</span>
                    <span />
                  </div>
                  <div className="space-y-2">
                    {lines.map((line) => (
                      <div key={line._key} className="grid grid-cols-[1fr_80px_130px_130px_40px] gap-2 items-center">
                        <Input placeholder="Description" value={line.description}
                          onChange={(e) => updateLine(line._key, 'description', e.target.value)} />
                        <Input type="number" min="0" value={line.quantity || ''}
                          onChange={(e) => updateLine(line._key, 'quantity', e.target.value)} className="text-center" />
                        <Input type="number" min="0" value={line.unitPrice || ''}
                          onChange={(e) => updateLine(line._key, 'unitPrice', e.target.value)} className="text-right" />
                        <div className="flex h-10 items-center justify-end rounded-lg border bg-muted/40 px-3 text-sm font-medium">
                          {Math.round(line.total).toLocaleString('fr-FR')}
                        </div>
                        <button onClick={() => removeLine(line._key)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 md:hidden">
                  {lines.map((line, idx) => (
                    <div key={line._key} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Ligne {idx + 1}</span>
                        <button onClick={() => removeLine(line._key)} className="text-red-400">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <Input placeholder="Description" value={line.description}
                        onChange={(e) => updateLine(line._key, 'description', e.target.value)} />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="mb-1 block text-xs text-muted-foreground">Qté</label>
                          <Input type="number" value={line.quantity || ''}
                            onChange={(e) => updateLine(line._key, 'quantity', e.target.value)} />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-muted-foreground">Prix HT</label>
                          <Input type="number" value={line.unitPrice || ''}
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

                <Button variant="outline"
                  onClick={() => setLines((p) => [...p, { _key: uid(), description: '', quantity: 1, unitPrice: 0, total: 0 }])}
                  className="mt-4 w-full" size="sm">
                  <Plus className="mr-2 h-4 w-4" />Ajouter une ligne
                </Button>

                <div className="mt-6 ml-auto w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total HT</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {invoice.taxLabel}{TAX_RATE > 0 ? ` ${TAX_RATE}%` : ''}
                    </span>
                    <span className="font-medium">{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-primary/5 px-3 py-2 font-bold">
                    <span>Total TTC</span>
                    <span className="text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="mb-3 font-semibold">Notes</p>
                <Textarea placeholder="Notes pour le client..." value={notes}
                  onChange={(e) => setNotes(e.target.value)} rows={3} />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pb-6">
              <Button variant="outline" onClick={() => setEditing(false)}>Annuler</Button>
              <Button variant="outline" onClick={() => handleSave('draft')}>
                <Save className="mr-2 h-4 w-4" />Enregistrer brouillon
              </Button>
              <Button className="rounded-full px-6" onClick={() => handleSave('sent')}>
                <Send className="mr-2 h-4 w-4" />Envoyer la facture
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
