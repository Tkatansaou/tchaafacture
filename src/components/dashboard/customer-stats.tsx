import { mockCustomers } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatCurrency } from '@/lib/formatters'
import { Users } from 'lucide-react'

const topCustomers = [...mockCustomers]
  .sort((a, b) => b.totalAmount - a.totalAmount)
  .slice(0, 3)

export function CustomerStats() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Clients</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4 rounded-lg bg-primary/5 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-3xl font-bold">{mockCustomers.length}</p>
            <p className="text-sm text-muted-foreground">clients actifs</p>
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Top clients
          </p>
          <div className="space-y-3">
            {topCustomers.map((customer) => (
              <div key={customer.id} className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.avatarSeed}`}
                    alt={customer.name}
                  />
                  <AvatarFallback>
                    {customer.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">{customer.totalInvoices} factures</p>
                </div>
                <p className="text-xs font-semibold text-primary">
                  {formatCurrency(customer.totalAmount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
