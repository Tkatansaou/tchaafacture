'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createInvoice } from './invoices'
import type { Quote, QuoteStatus, InvoiceItem } from '@/lib/types'

function rowToQuote(row: Record<string, unknown>, items: InvoiceItem[] = []): Quote {
  return {
    id: row.id as string,
    customerId: (row.customer_id as string) ?? '',
    customerName: row.customer_name as string,
    customerCompany: (row.customer_company as string) ?? '',
    customerEmail: (row.customer_email as string) ?? '',
    customerPhone: (row.customer_phone as string) ?? '',
    customerAddress: (row.customer_address as string) ?? '',
    date: row.date as string,
    expiryDate: row.expiry_date as string,
    subtotal: row.subtotal as number,
    tax: row.tax as number,
    taxRate: Number(row.tax_rate),
    taxLabel: (row.tax_label as string) ?? 'TVA',
    amount: row.amount as number,
    status: row.status as QuoteStatus,
    notes: (row.notes as string) ?? '',
    convertedToInvoiceId: (row.converted_to_invoice_id as string) ?? null,
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

export async function getQuotes(): Promise<Quote[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => rowToQuote(row))
}

export async function getQuote(id: string): Promise<Quote | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const [quoteResult, itemsResult] = await Promise.all([
    supabase.from('quotes').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('quote_items').select('*').eq('quote_id', id).order('position', { ascending: true }),
  ])

  if (quoteResult.error || !quoteResult.data) return null
  return rowToQuote(quoteResult.data, (itemsResult.data ?? []).map(rowToItem))
}

async function nextQuoteNumber(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string> {
  const [settingsResult, countResult] = await Promise.all([
    supabase.from('company_settings').select('invoice_prefix').eq('user_id', userId).single(),
    supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ])
  const prefix = (settingsResult.data?.invoice_prefix ?? 'INV-').replace('INV-', 'DEV-')
  const count = (countResult.count ?? 0) + 1
  return `${prefix}${String(count).padStart(3, '0')}`
}

export async function createQuote(quote: Omit<Quote, 'id' | 'convertedToInvoiceId'>): Promise<Quote> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const id = await nextQuoteNumber(supabase, user.id)
  const items = quote.items ?? []

  const { data: row, error } = await supabase
    .from('quotes')
    .insert({
      id,
      user_id: user.id,
      customer_id: quote.customerId || null,
      customer_name: quote.customerName,
      customer_company: quote.customerCompany,
      customer_email: quote.customerEmail,
      customer_phone: quote.customerPhone,
      customer_address: quote.customerAddress,
      date: quote.date,
      expiry_date: quote.expiryDate,
      subtotal: Math.round(quote.subtotal),
      tax: Math.round(quote.tax),
      tax_rate: quote.taxRate,
      tax_label: quote.taxLabel ?? 'TVA',
      amount: Math.round(quote.amount),
      status: quote.status,
      notes: quote.notes,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  if (items.length > 0) {
    await supabase.from('quote_items').insert(
      items.map((item, index) => ({
        quote_id: id,
        description: item.description,
        quantity: item.quantity,
        unit_price: Math.round(item.unitPrice),
        total: Math.round(item.total),
        position: index,
      }))
    )
  }

  revalidatePath('/quotes')
  return rowToQuote(row, items)
}

export async function updateQuote(quote: Quote): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('quotes')
    .update({
      customer_id: quote.customerId || null,
      customer_name: quote.customerName,
      customer_company: quote.customerCompany,
      customer_email: quote.customerEmail,
      customer_phone: quote.customerPhone,
      customer_address: quote.customerAddress,
      date: quote.date,
      expiry_date: quote.expiryDate,
      subtotal: Math.round(quote.subtotal),
      tax: Math.round(quote.tax),
      tax_rate: quote.taxRate,
      tax_label: quote.taxLabel ?? 'TVA',
      amount: Math.round(quote.amount),
      status: quote.status,
      notes: quote.notes,
    })
    .eq('id', quote.id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  await supabase.from('quote_items').delete().eq('quote_id', quote.id)
  if (quote.items.length > 0) {
    await supabase.from('quote_items').insert(
      quote.items.map((item, index) => ({
        quote_id: quote.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: Math.round(item.unitPrice),
        total: Math.round(item.total),
        position: index,
      }))
    )
  }

  revalidatePath('/quotes')
  revalidatePath(`/quotes/${quote.id}`)
}

export async function updateQuoteStatus(id: string, status: QuoteStatus): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  await supabase.from('quotes').update({ status }).eq('id', id).eq('user_id', user.id)
  revalidatePath('/quotes')
  revalidatePath(`/quotes/${id}`)
}

export async function deleteQuote(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  await supabase.from('quotes').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/quotes')
}

export async function convertQuoteToInvoice(quoteId: string): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const quote = await getQuote(quoteId)
  if (!quote) throw new Error('Devis introuvable')

  const today = new Date().toISOString().split('T')[0]
  const settingsResult = await supabase
    .from('company_settings')
    .select('payment_terms')
    .eq('user_id', user.id)
    .single()
  const paymentTerms = settingsResult.data?.payment_terms ?? 30
  const dueDate = new Date(Date.now() + paymentTerms * 86400000).toISOString().split('T')[0]

  const invoice = await createInvoice({
    customerId: quote.customerId,
    customerName: quote.customerName,
    customerCompany: quote.customerCompany,
    customerEmail: quote.customerEmail,
    customerPhone: quote.customerPhone,
    customerAddress: quote.customerAddress,
    date: today,
    dueDate,
    subtotal: quote.subtotal,
    tax: quote.tax,
    taxRate: quote.taxRate,
    taxLabel: quote.taxLabel,
    amount: quote.amount,
    status: 'draft',
    items: quote.items,
    notes: quote.notes,
  })

  await supabase
    .from('quotes')
    .update({ status: 'accepted', converted_to_invoice_id: invoice.id })
    .eq('id', quoteId)
    .eq('user_id', user.id)

  revalidatePath('/quotes')
  revalidatePath('/invoices')
  return invoice.id
}
