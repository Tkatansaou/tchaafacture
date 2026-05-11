'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Invoice, RevenueDataPoint } from '@/lib/types'

function formatY(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`
  return String(value)
}

function formatXOF(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'XOF',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value)
}

function computeMonthlyData(invoices: Invoice[]): RevenueDataPoint[] {
  const now = new Date()
  const result: RevenueDataPoint[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d)
    const monthLabel = label.charAt(0).toUpperCase() + label.slice(1)

    const monthInvoices = invoices.filter(
      (inv) => inv.date.startsWith(yearMonth) && inv.status !== 'draft'
    )

    const paid = monthInvoices
      .filter((i) => i.status === 'paid')
      .reduce((s, i) => s + i.subtotal, 0)

    const pending = monthInvoices
      .filter((i) => i.status === 'sent' || i.status === 'overdue')
      .reduce((s, i) => s + i.subtotal, 0)

    result.push({ month: monthLabel, revenue: paid + pending, paid, pending })
  }

  return result
}

interface RevenueChartProps {
  invoices: Invoice[]
}

export function RevenueChart({ invoices }: RevenueChartProps) {
  const data = computeMonthlyData(invoices)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tickFormatter={formatY}
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false} tickLine={false} width={50}
        />
        <Tooltip
          formatter={(value, name) => [
            formatXOF(Number(value)),
            name === 'paid' ? 'Encaissé' : 'En attente',
          ]}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
            fontSize: '12px',
          }}
        />
        <Legend
          formatter={(value) => (value === 'paid' ? 'Encaissé' : 'En attente')}
          wrapperStyle={{ fontSize: '12px' }}
        />
        <Line
          type="monotone" dataKey="paid"
          stroke="hsl(var(--primary))" strokeWidth={2}
          dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }}
        />
        <Line
          type="monotone" dataKey="pending"
          stroke="#f59e0b" strokeWidth={2}
          dot={{ r: 4, fill: '#f59e0b' }} activeDot={{ r: 6 }}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
