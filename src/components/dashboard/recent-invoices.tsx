import { mockInvoices } from '@/lib/mock-data'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { InvoiceStatus } from '@/lib/types'

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

const recentInvoices = [...mockInvoices]
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, 5)

export function RecentInvoices() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Facture</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Échéance</TableHead>
          <TableHead className="text-right">Montant</TableHead>
          <TableHead>Statut</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentInvoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-mono text-xs font-medium">{invoice.id}</TableCell>
            <TableCell className="font-medium">{invoice.customerName}</TableCell>
            <TableCell className="text-muted-foreground">{formatDate(invoice.dueDate)}</TableCell>
            <TableCell className="text-right font-medium">{formatCurrency(invoice.amount)}</TableCell>
            <TableCell>
              <Badge variant={statusVariant[invoice.status]}>
                {statusLabel[invoice.status]}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
