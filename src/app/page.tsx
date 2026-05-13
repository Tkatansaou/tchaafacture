'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Suspense } from 'react'
import {
  TrendingUp, CheckCircle, Clock, AlertCircle,
  FileText, FilePlus, Users, UserPlus, Settings, ArrowRight, List,
} from 'lucide-react'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { RecentInvoices } from '@/components/dashboard/recent-invoices'
import { CustomerStats } from '@/components/dashboard/customer-stats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getInvoices } from '@/lib/actions/invoices'
import { getCustomers } from '@/lib/actions/customers'
import { formatCurrency } from '@/lib/formatters'
import type { Invoice, Customer } from '@/lib/types'

const quickLinks = [
  {
    href: '/invoices/new',
    label: 'Nouvelle facture',
    description: 'Créer et envoyer une facture',
    icon: FilePlus,
    color: 'bg-blue-500/10 text-blue-600',
    border: 'hover:border-blue-200',
  },
  {
    href: '/invoices',
    label: 'Mes factures',
    description: 'Voir toutes les factures',
    icon: List,
    color: 'bg-indigo-500/10 text-indigo-600',
    border: 'hover:border-indigo-200',
  },
  {
    href: '/customers/new',
    label: 'Nouveau client',
    description: 'Ajouter un client',
    icon: UserPlus,
    color: 'bg-emerald-500/10 text-emerald-600',
    border: 'hover:border-emerald-200',
  },
  {
    href: '/customers',
    label: 'Mes clients',
    description: 'Gérer les clients',
    icon: Users,
    color: 'bg-violet-500/10 text-violet-600',
    border: 'hover:border-violet-200',
  },
  {
    href: '/settings',
    label: 'Paramètres',
    description: "Configurer l'application",
    icon: Settings,
    color: 'bg-slate-500/10 text-slate-600',
    border: 'hover:border-slate-200',
  },
]

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])

  useEffect(() => {
    getInvoices().then(setInvoices).catch(console.error)
    getCustomers().then(setCustomers).catch(console.error)
  }, [])

  const active  = invoices.filter((i) => i.status !== 'draft')
  const paid    = invoices.filter((i) => i.status === 'paid')
  const sent    = invoices.filter((i) => i.status === 'sent')
  const overdue = invoices.filter((i) => i.status === 'overdue')

  const totalFacture = active.reduce((s, i) => s + i.amount, 0)
  const totalPaid    = paid.reduce((s, i) => s + i.amount, 0)
  const totalSent    = sent.reduce((s, i) => s + i.amount, 0)
  const totalOverdue = overdue.reduce((s, i) => s + i.amount, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <div className="fade-in-up flex items-start justify-between" style={{ animationDelay: '0ms' }}>
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

        <div className="fade-in-up" style={{ animationDelay: '60ms' }}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Accès rapide
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {quickLinks.map((link, i) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`fade-in-up group flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${link.border}`}
                  style={{ animationDelay: `${80 + i * 50}ms` }}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${link.color} transition-transform duration-200 group-hover:scale-110`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold leading-tight">{link.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-tight hidden sm:block">{link.description}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100" />
                </Link>
              )
            })}
          </div>
        </div>

        <div className="fade-in-up grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4" style={{ animationDelay: '180ms' }}>
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

        <div className="fade-in-up grid gap-6 lg:grid-cols-3" style={{ animationDelay: '260ms' }}>
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
          <CustomerStats customers={customers} />
        </div>

        <div className="fade-in-up" style={{ animationDelay: '340ms' }}>
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

      </div>
    </DashboardLayout>
  )
}
