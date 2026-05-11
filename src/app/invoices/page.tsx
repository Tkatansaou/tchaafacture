'use client'

import { useState } from 'react'
import { Plus, Search, Eye, Pencil, Trash2, CheckCircle } from 'lucide-react'
import Link from 'next/link'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useInvoices } from '@/lib/store'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { InvoiceStatus } from '@/lib/types'

const statusVariant: Record<InvoiceStatus, 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline'> = {
  draft: 'outline',
  sent: 'secondary',
  paid: 'success',
  overdue: 'danger',
}

const statusLabel: Record<InvoiceStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  paid: 'Payée',
  overdue: 'En retard',
}

type FilterTab = 'all' | InvoiceStatus

const tabs: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'sent', label: 'Envoyées' },
  { value: 'paid', label: 'Payées' },
  { value: 'overdue', label: 'En retard' },
]

export default function InvoicesPage() {
  const { invoices, updateInvoice, deleteInvoice } = useInvoices()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = invoices
    .filter((inv) => activeTab === 'all' || inv.status === activeTab)
    .filter((inv) => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return inv.id.toLowerCase().includes(q) || inv.customerName.toLowerCase().includes(q)
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const markPaid = (id: string) => {
    const inv = invoices.find((i) => i.id === id)
    if (inv) updateInvoice({ ...inv, status: 'paid' })
  }

  const handleDelete = (id: string) => {
    if (confirm('Supprimer cette facture ?')) deleteInvoice(id)
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Factures</h1>
            <p className="text-sm text-muted-foreground">{invoices.length} factures au total</p>
          </div>
          <Button className="rounded-full px-4 md:px-6" asChild>
            <Link href="/invoices/new">
              <Plus className="mr-0 h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Nouvelle facture</span>
            </Link>
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="N° facture ou client..."
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
                  {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[110px]">N° Facture</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="hidden md:table-cell w-[120px]">Date</TableHead>
                      <TableHead className="hidden md:table-cell w-[120px]">Échéance</TableHead>
                      <TableHead className="w-[140px] text-right">Montant TTC</TableHead>
                      <TableHead className="w-[120px]">Statut</TableHead>
                      <TableHead className="w-[120px] text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                          Aucune facture trouvée.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono text-xs font-semibold">{invoice.id}</TableCell>
                          <TableCell className="font-medium">{invoice.customerName}</TableCell>
                          <TableCell className="hidden text-muted-foreground md:table-cell">{formatDate(invoice.date)}</TableCell>
                          <TableCell className={`hidden md:table-cell ${invoice.status === 'overdue' ? 'font-medium text-red-500' : 'text-muted-foreground'}`}>
                            {formatDate(invoice.dueDate)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(invoice.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[invoice.status]}>{statusLabel[invoice.status]}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-0.5">
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Voir" asChild>
                                <Link href={`/invoices/${invoice.id}`}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Modifier" asChild>
                                <Link href={`/invoices/${invoice.id}?edit=true`}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                              {invoice.status !== 'paid' && (
                                <Button
                                  variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700"
                                  title="Marquer payée" onClick={() => markPaid(invoice.id)}
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600"
                                title="Supprimer" onClick={() => handleDelete(invoice.id)}
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
