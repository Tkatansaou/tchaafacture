import Link from "next/link"
import { TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Suspense } from "react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { RecentInvoices } from "@/components/dashboard/recent-invoices"
import { CustomerStats } from "@/components/dashboard/customer-stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { kpiData } from "@/lib/mock-data"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue sur tchaaFacture — voici un aperçu de votre activité.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Revenu total"
            value={kpiData.totalRevenue.value}
            change={kpiData.totalRevenue.change}
            changePositive={kpiData.totalRevenue.positive}
            icon={<TrendingUp className="h-5 w-5" />}
            iconClassName="bg-primary/10 text-primary"
          />
          <KpiCard
            title="Factures payées"
            value={kpiData.paidInvoices.value}
            change={kpiData.paidInvoices.change}
            changePositive={kpiData.paidInvoices.positive}
            icon={<CheckCircle className="h-5 w-5" />}
            iconClassName="bg-green-100 text-green-600"
          />
          <KpiCard
            title="En attente"
            value={kpiData.pending.value}
            change={kpiData.pending.change}
            changePositive={kpiData.pending.positive}
            icon={<Clock className="h-5 w-5" />}
            iconClassName="bg-yellow-100 text-yellow-600"
          />
          <KpiCard
            title="En retard"
            value={kpiData.overdue.value}
            change={kpiData.overdue.change}
            changePositive={kpiData.overdue.positive}
            icon={<AlertCircle className="h-5 w-5" />}
            iconClassName="bg-red-100 text-red-500"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenus mensuels</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <Suspense fallback={<div className="h-full animate-pulse rounded-lg bg-muted" />}>
                <RevenueChart />
              </Suspense>
            </CardContent>
          </Card>

          <CustomerStats />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Factures récentes</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/invoices">Voir tout</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <RecentInvoices />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
