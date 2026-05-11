'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { TrendingUp, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { RecentInvoices } from '@/components/dashboard/recent-invoices'
import { CustomerStats } from '@/components/dashboard/customer-stats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useInvoices } from '@/lib/store'
import { formatCurrency } from '@/lib/formatters'

export default function DashboardPage() {
  const { invoices } = useInvoices()

  const active = invoices.filter((i) => i.status !== 'draft')
  const paid = invoices.filter((i) => i.status === 'paid')
  const sent = invoices.filter((i) => i.status === 'sent')
  const overdue = invoices.filter((i) => i.status === 'overdue')

  const totalFacture = active.reduce((s, i) => s + i.amount, 0)
  const totalPaid = paid.reduce((s, i) => s + i.amount, 0)
  const totalSent = sent.reduce((s, i) => s + i.amount, 0)
  const totalOverdue = overdue.reduce((s, i) => s + i.amount, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Tableau de bord</h1>
            <p className="text-sm text-muted-foreground">Aperçu de votre activité de facturation</p>
          </div>
          <Button className="rounded-full px-4 md:px-6" asChild>
            <Link href="/invoices/new">
              <FileText className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Nouvelle facture</span>
              <span className="md:hidden">Créer</span>
            </Link>
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          <KpiCard
            title="Total facturé"
            value={formatCurrency(totalFacture)}
            change={`${active.length} facture${active.length > 1 ? 's' : ''} émises`}
            changePositive
            icon={<TrendingUp className="h-5 w-5" />}
            iconClassName="bg-primary/10 text-primary"
          />
          <KpiCard
            title="Montant payé"
            value={formatCurrency(totalPaid)}
            change={`${paid.length} facture${paid.length > 1 ? 's' : ''} réglées`}
            changePositive
            icon={<CheckCircle className="h-5 w-5" />}
            iconClassName="bg-green-100 text-green-600"
          />
          <KpiCard
            title="En attente"
            value={formatCurrency(totalSent)}
            change={`${sent.length} facture${sent.length > 1 ? 's' : ''} envoyées`}
            changePositive={false}
            icon={<Clock className="h-5 w-5" />}
            iconClassName="bg-yellow-100 text-yellow-600"
          />
          <KpiCard
            title="En retard"
            value={formatCurrency(totalOverdue)}
            change={`${overdue.length} facture${overdue.length > 1 ? 's' : ''} impayées`}
            changePositive={false}
            icon={<AlertCircle className="h-5 w-5" />}
            iconClassName="bg-red-100 text-red-500"
          />
        </div>

        {/* Chart + Customers */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenus mensuels (HT)</CardTitle>
            </CardHeader>
            <CardContent className="h-[260px] md:h-[300px]">
              <Suspense fallback={<div className="h-full animate-pulse rounded-lg bg-muted" />}>
                <RevenueChart invoices={invoices} />
              </Suspense>
            </CardContent>
          </Card>
          <CustomerStats />
        </div>

        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Factures récentes</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/invoices">Voir tout</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            <RecentInvoices invoices={invoices} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
