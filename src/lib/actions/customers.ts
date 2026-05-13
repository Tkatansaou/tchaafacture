'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Customer } from '@/lib/types'

function rowToCustomer(
  row: Record<string, unknown>,
  stats: { count: number; total: number }
): Customer {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    phone: row.phone as string,
    company: row.company as string,
    address: row.address as string,
    avatarSeed: row.avatar_seed as string,
    totalInvoices: stats.count,
    totalAmount: stats.total,
    createdAt: row.created_at as string,
  }
}

export async function getCustomers(): Promise<Customer[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const [customersResult, invoicesResult] = await Promise.all([
    supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('invoices')
      .select('customer_id, amount')
      .eq('user_id', user.id),
  ])

  if (customersResult.error) throw new Error(customersResult.error.message)

  const statsMap: Record<string, { count: number; total: number }> = {}
  for (const inv of invoicesResult.data ?? []) {
    if (!inv.customer_id) continue
    if (!statsMap[inv.customer_id]) statsMap[inv.customer_id] = { count: 0, total: 0 }
    statsMap[inv.customer_id].count++
    statsMap[inv.customer_id].total += inv.amount
  }

  return (customersResult.data ?? []).map((row) =>
    rowToCustomer(row, statsMap[row.id] ?? { count: 0, total: 0 })
  )
}

export async function createCustomer(
  data: Omit<Customer, 'id' | 'totalInvoices' | 'totalAmount' | 'createdAt'>
): Promise<Customer> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: row, error } = await supabase
    .from('customers')
    .insert({
      user_id: user.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      address: data.address,
      avatar_seed: data.avatarSeed,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/customers')
  return rowToCustomer(row, { count: 0, total: 0 })
}

export async function updateCustomer(
  data: Omit<Customer, 'totalInvoices' | 'totalAmount' | 'createdAt'>
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('customers')
    .update({
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      address: data.address,
      avatar_seed: data.avatarSeed,
    })
    .eq('id', data.id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/customers')
}

export async function deleteCustomer(id: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/customers')
}
