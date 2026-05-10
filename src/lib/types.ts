export type InvoiceStatus = 'paid' | 'pending' | 'overdue'

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  company: string
  address: string
  avatarSeed: string
  totalInvoices: number
  totalAmount: number
  createdAt: string
}

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Invoice {
  id: string
  customerId: string
  customerName: string
  date: string
  dueDate: string
  amount: number
  status: InvoiceStatus
  items: InvoiceItem[]
}

export interface RevenueDataPoint {
  month: string
  revenue: number
  paid: number
  pending: number
}
