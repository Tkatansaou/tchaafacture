import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { Invoice, InvoiceStatus } from '@/lib/types'

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

interface RecentInvoicesProps {
  invoices: Invoice[]
}

export function RecentInvoices({ invoices }: RecentInvoicesProps) {
  const recent = [...invoices]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Facture</TableHead>
          <TableHead>Client</TableHead>
          <TableHead className="hidden md:table-cell">Échéance</TableHead>
          <TableHead className="text-right">Montant TTC</TableHead>
          <TableHead>Statut</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recent.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-mono text-xs font-medium">{invoice.id}</TableCell>
            <TableCell className="font-medium">{invoice.customerName}</TableCell>
            <TableCell className="hidden text-muted-foreground md:table-cell">
              {formatDate(invoice.dueDate)}
            </TableCell>
            <TableCell className="text-right font-medium">{formatCurrency(invoice.amount)}</TableCell>
            <TableCell>
              <Badge variant={statusVariant[invoice.status]}>{statusLabel[invoice.status]}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
