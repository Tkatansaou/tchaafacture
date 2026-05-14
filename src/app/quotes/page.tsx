'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Eye, Pencil, Trash2, FileCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getQuotes, deleteQuote, convertQuoteToInvoice } from '@/lib/actions/quotes'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { Quote, QuoteStatus } from '@/lib/types'

const statusVariant: Record<QuoteStatus, 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline'> = {
  draft: 'outline',
  sent: 'secondary',
  accepted: 'success',
  rejected: 'danger',
  expired: 'warning',
}

const statusLabel: Record<QuoteStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  rejected: 'Refusé',
  expired: 'Expiré',
}

type FilterTab = 'all' | QuoteStatus

const tabs: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'sent', label: 'Envoyés' },
  { value: 'accepted', label: 'Acceptés' },
  { value: 'rejected', label: 'Refusés' },
  { value: 'expired', label: 'Expirés' },
]

export default function QuotesPage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [converting, setConverting] = useState<string | null>(null)

  useEffect(() => {
    getQuotes()
      .then(setQuotes)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = quotes
    .filter((q) => activeTab === 'all' || q.status === activeTab)
    .filter((q) => {
      if (!searchQuery) return true
      const s = searchQuery.toLowerCase()
      return q.id.toLowerCase().includes(s) || q.customerName.toLowerCase().includes(s)
    })

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce devis ?')) return
    await deleteQuote(id)
    setQuotes((prev) => prev.filter((q) => q.id !== id))
  }

  const handleConvert = async (id: string) => {
    if (!confirm('Convertir ce devis en facture ?')) return
    setConverting(id)
    try {
      const invoiceId = await convertQuoteToInvoice(id)
      setQuotes((prev) => prev.map((q) => q.id === id ? { ...q, status: 'accepted', convertedToInvoiceId: invoiceId } : q))
      router.push(`/invoices/${invoiceId}`)
    } catch (err) {
      console.error(err)
      alert('Erreur lors de la conversion.')
    } finally {
      setConverting(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Devis</h1>
            <p className="text-sm text-muted-foreground">{quotes.length} devis au total</p>
          </div>
          <Button className="rounded-full px-4 md:px-6" asChild>
            <Link href="/quotes/new">
              <Plus className="mr-0 h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Nouveau devis</span>
            </Link>
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="N° devis ou client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
          <TabsList className="flex-wrap h-auto gap-1">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              <div className="rounded-xl border bg-card">
                <div className="border-b px-4 py-2.5 text-sm text-muted-foreground">
                  {loading ? 'Chargement…' : `${filtered.length} résultat${filtered.length !== 1 ? 's' : ''}`}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[110px]">N° Devis</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="hidden md:table-cell w-[120px]">Date</TableHead>
                      <TableHead className="hidden md:table-cell w-[120px]">Expiration</TableHead>
                      <TableHead className="w-[140px] text-right">Montant TTC</TableHead>
                      <TableHead className="w-[120px]">Statut</TableHead>
                      <TableHead className="w-[140px] text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                          {loading ? 'Chargement des devis…' : 'Aucun devis trouvé.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((quote) => (
                        <TableRow key={quote.id}>
                          <TableCell className="font-mono text-xs font-semibold">{quote.id}</TableCell>
                          <TableCell className="font-medium">{quote.customerName}</TableCell>
                          <TableCell className="hidden text-muted-foreground md:table-cell">{formatDate(quote.date)}</TableCell>
                          <TableCell className="hidden text-muted-foreground md:table-cell">{formatDate(quote.expiryDate)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(quote.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[quote.status]}>{statusLabel[quote.status]}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-0.5">
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Voir" asChild>
                                <Link href={`/quotes/${quote.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Modifier" asChild>
                                <Link href={`/quotes/${quote.id}?edit=true`}><Pencil className="h-3.5 w-3.5" /></Link>
                              </Button>
                              {!quote.convertedToInvoiceId && quote.status !== 'rejected' && (
                                <Button
                                  variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700"
                                  title="Convertir en facture"
                                  disabled={converting === quote.id}
                                  onClick={() => handleConvert(quote.id)}
                                >
                                  <FileCheck className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600"
                                title="Supprimer" onClick={() => handleDelete(quote.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
