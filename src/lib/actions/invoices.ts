'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Invoice, InvoiceItem, InvoiceStatus } from '@/lib/types'

function rowToInvoice(row: Record<string, unknown>, items: InvoiceItem[] = []): Invoice {
  return {
    id: row.id as string,
    customerId: (row.customer_id as string) ?? '',
    customerName: row.customer_name as string,
    customerCompany: (row.customer_company as string) ?? '',
    customerEmail: (row.customer_email as string) ?? '',
    customerPhone: (row.customer_phone as string) ?? '',
    customerAddress: (row.customer_address as string) ?? '',
    date: row.date as string,
    dueDate: row.due_date as string,
    subtotal: row.subtotal as number,
    tax: row.tax as number,
    taxRate: Number(row.tax_rate),
    taxLabel: (row.tax_label as string) ?? 'TVA',
    amount: row.amount as number,
    status: row.status as InvoiceStatus,
    notes: (row.notes as string) ?? '',
    items,
  }
}

function rowToItem(row: Record<string, unknown>): InvoiceItem {
  return {
    description: row.description as string,
    quantity: Number(row.quantity),
    unitPrice: row.unit_price as number,
    total: row.total as number,
  }
}

export async function getInvoices(): Promise<Invoice[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => rowToInvoice(row))
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const [invoiceResult, itemsResult] = await Promise.all([
    supabase.from('invoices').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('position', { ascending: true }),
  ])

  if (invoiceResult.error || !invoiceResult.data) return null
  const items = (itemsResult.data ?? []).map(rowToItem)
  return rowToInvoice(invoiceResult.data, items)
}

export async function nextInvoiceNumber(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const [settingsResult, countResult] = await Promise.all([
    supabase.from('company_settings').select('invoice_prefix, starting_number').eq('user_id', user.id).single(),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const prefix = settingsResult.data?.invoice_prefix ?? 'INV-'
  const startingNumber = settingsResult.data?.starting_number ?? 1
  const count = countResult.count ?? 0
  const num = startingNumber + count
  return `${prefix}${String(num).padStart(3, '0')}`
}

export async function createInvoice(invoice: Omit<Invoice, 'id'> & { id?: string }): Promise<Invoice> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const id = invoice.id ?? (await nextInvoiceNumber())
  const items = invoice.items ?? []

  const { data: row, error } = await supabase
    .from('invoices')
    .insert({
      id,
      user_id: user.id,
      customer_id: invoice.customerId || null,
      customer_name: invoice.customerName,
      customer_company: invoice.customerCompany,
      customer_email: invoice.customerEmail,
      customer_phone: invoice.customerPhone,
      customer_address: invoice.customerAddress,
      date: invoice.date,
      due_date: invoice.dueDate,
      subtotal: Math.round(invoice.subtotal),
      tax: Math.round(invoice.tax),
      tax_rate: invoice.taxRate,
      tax_label: invoice.taxLabel ?? 'TVA',
      amount: Math.round(invoice.amount),
      status: invoice.status,
      notes: invoice.notes,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  if (items.length > 0) {
    const { error: itemsError } = await supabase.from('invoice_items').insert(
      items.map((item, index) => ({
        invoice_id: id,
        description: item.description,
        quantity: item.quantity,
        unit_price: Math.round(item.unitPrice),
        total: Math.round(item.total),
        position: index,
      }))
    )
    if (itemsError) throw new Error(itemsError.message)
  }

  revalidatePath('/invoices')
  revalidatePath('/')
  return rowToInvoice(row, items)
}

export async function updateInvoice(invoice: Invoice): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('invoices')
    .update({
      customer_id: invoice.customerId || null,
      customer_name: invoice.customerName,
      customer_company: invoice.customerCompany,
      customer_email: invoice.customerEmail,
      customer_phone: invoice.customerPhone,
      customer_address: invoice.customerAddress,
      date: invoice.date,
      due_date: invoice.dueDate,
      subtotal: Math.round(invoice.subtotal),
      tax: Math.round(invoice.tax),
      tax_rate: invoice.taxRate,
      tax_label: invoice.taxLabel ?? 'TVA',
      amount: Math.round(invoice.amount),
      status: invoice.status,
      notes: invoice.notes,
    })
    .eq('id', invoice.id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  // Remplacer les items
  await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id)

  if (invoice.items.length > 0) {
    await supabase.from('invoice_items').insert(
      invoice.items.map((item, index) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: Math.round(item.unitPrice),
        total: Math.round(item.total),
        position: index,
      }))
    )
  }

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${invoice.id}`)
  revalidatePath('/')
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('invoices')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/invoices')
  revalidatePath(`/invoices/${id}`)
  revalidatePath('/')
}

export async function deleteInvoice(id: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/invoices')
  revalidatePath('/')
}
