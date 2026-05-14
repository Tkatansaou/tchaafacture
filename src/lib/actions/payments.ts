'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Payment } from '@/lib/types'

function rowToPayment(row: Record<string, unknown>): Payment {
  return {
    id: row.id as string,
    invoiceId: row.invoice_id as string,
    amount: row.amount as number,
    date: row.date as string,
    method: (row.method as string) ?? '',
    reference: (row.reference as string) ?? '',
    notes: (row.notes as string) ?? '',
    createdAt: row.created_at as string,
  }
}

export async function getPayments(invoiceId: string): Promise<Payment[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .eq('user_id', user.id)
    .order('date', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToPayment)
}

export async function addPayment(
  invoiceId: string,
  payment: Omit<Payment, 'id' | 'invoiceId' | 'createdAt'>,
): Promise<Payment> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('payments')
    .insert({
      user_id: user.id,
      invoice_id: invoiceId,
      amount: Math.round(payment.amount),
      date: payment.date,
      method: payment.method,
      reference: payment.reference,
      notes: payment.notes,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Calculer le total payé et mettre à jour le statut de la facture
  const { data: allPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('invoice_id', invoiceId)
    .eq('user_id', user.id)

  const { data: invoice } = await supabase
    .from('invoices')
    .select('amount')
    .eq('id', invoiceId)
    .eq('user_id', user.id)
    .single()

  if (invoice && allPayments) {
    const totalPaid = allPayments.reduce((s, p) => s + (p.amount as number), 0)
    const newStatus = totalPaid >= invoice.amount ? 'paid' : 'sent'
    await supabase.from('invoices').update({ status: newStatus }).eq('id', invoiceId).eq('user_id', user.id)
  }

  revalidatePath(`/invoices/${invoiceId}`)
  return rowToPayment(data)
}

export async function deletePayment(paymentId: string, invoiceId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  await supabase.from('payments').delete().eq('id', paymentId).eq('user_id', user.id)

  // Recalculer le statut
  const { data: allPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('invoice_id', invoiceId)
    .eq('user_id', user.id)

  const { data: invoice } = await supabase
    .from('invoices')
    .select('amount, status')
    .eq('id', invoiceId)
    .eq('user_id', user.id)
    .single()

  if (invoice && allPayments !== null) {
    const totalPaid = allPayments.reduce((s, p) => s + (p.amount as number), 0)
    if (invoice.status === 'paid' && totalPaid < invoice.amount) {
      await supabase.from('invoices').update({ status: 'sent' }).eq('id', invoiceId).eq('user_id', user.id)
    }
  }

  revalidatePath(`/invoices/${invoiceId}`)
}
