export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export interface CompanySettings {
  name: string
  email: string
  phone: string
  address: string
  logoUrl: string
  currency: string
  paymentTerms: number
  invoicePrefix: string
  startingNumber: number
  taxRate: number
}

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
  customerCompany: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  date: string
  dueDate: string
  subtotal: number
  tax: number
  taxRate: number
  amount: number
  status: InvoiceStatus
  items: InvoiceItem[]
  notes: string
}

export interface RevenueDataPoint {
  month: string
  revenue: number
  paid: number
  pending: number
}
