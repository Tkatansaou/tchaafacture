'use client'

import { useState } from "react"
import { Plus, Search, Eye, Pencil } from "lucide-react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { mockInvoices } from "@/lib/mock-data"
import { formatCurrency, formatDate } from "@/lib/formatters"
import { InvoiceStatus } from "@/lib/types"

const statusVariant: Record<InvoiceStatus, 'success' | 'warning' | 'danger'> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
}

const statusLabel: Record<InvoiceStatus, string> = {
  paid: 'Payée',
  pending: 'En attente',
  overdue: 'En retard',
}

type FilterTab = 'all' | InvoiceStatus

const tabs: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'paid', label: 'Payées' },
  { value: 'pending', label: 'En attente' },
  { value: 'overdue', label: 'En retard' },
]

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = mockInvoices
    .filter((inv) => activeTab === 'all' || inv.status === activeTab)
    .filter((inv) => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        inv.id.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Factures</h1>
            <p className="text-muted-foreground">Gérez et suivez toutes vos factures.</p>
          </div>
          <Button className="rounded-full px-6">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle facture
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro ou client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              <div className="rounded-xl border bg-card">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    {filtered.length} facture{filtered.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">N° Facture</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="w-[130px]">Date</TableHead>
                      <TableHead className="w-[130px]">Échéance</TableHead>
                      <TableHead className="w-[150px] text-right">Montant</TableHead>
                      <TableHead className="w-[130px]">Statut</TableHead>
                      <TableHead className="w-[100px] text-center">Actions</TableHead>
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
                          <TableCell className="font-mono text-xs font-semibold">
                            {invoice.id}
                          </TableCell>
                          <TableCell className="font-medium">{invoice.customerName}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(invoice.date)}
                          </TableCell>
                          <TableCell
                            className={
                              invoice.status === 'overdue'
                                ? "font-medium text-red-500"
                                : "text-muted-foreground"
                            }
                          >
                            {formatDate(invoice.dueDate)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(invoice.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[invoice.status]}>
                              {statusLabel[invoice.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-4 w-4" />
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
