'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CompanySettings } from '@/lib/types'

const DEFAULT_SETTINGS: Omit<CompanySettings, 'logoUrl'> & { logo_url: string } = {
  name: 'Ma Société',
  email: 'contact@masociete.com',
  phone: '+228 90 00 00 00',
  address: 'Lomé, Togo',
  logo_url: '',
  currency: 'XOF',
  paymentTerms: 30,
  invoicePrefix: 'INV-',
  startingNumber: 1,
  taxRate: 18,
}

function rowToSettings(row: Record<string, unknown>): CompanySettings {
  return {
    name: row.name as string,
    email: row.email as string,
    phone: row.phone as string,
    address: row.address as string,
    logoUrl: row.logo_url as string,
    currency: row.currency as string,
    paymentTerms: row.payment_terms as number,
    invoicePrefix: row.invoice_prefix as string,
    startingNumber: row.starting_number as number,
    taxRate: Number(row.tax_rate),
  }
}

export async function getSettings(): Promise<CompanySettings> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    // Crée les settings par défaut si absent (normalement créé par le trigger)
    const { data: created } = await supabase
      .from('company_settings')
      .insert({ user_id: user.id, ...DEFAULT_SETTINGS })
      .select()
      .single()
    return created ? rowToSettings(created) : (DEFAULT_SETTINGS as unknown as CompanySettings)
  }

  return rowToSettings(data)
}

export async function updateSettings(updates: Partial<CompanySettings>): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const dbUpdates: Record<string, unknown> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.email !== undefined) dbUpdates.email = updates.email
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone
  if (updates.address !== undefined) dbUpdates.address = updates.address
  if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl
  if (updates.currency !== undefined) dbUpdates.currency = updates.currency
  if (updates.paymentTerms !== undefined) dbUpdates.payment_terms = updates.paymentTerms
  if (updates.invoicePrefix !== undefined) dbUpdates.invoice_prefix = updates.invoicePrefix
  if (updates.startingNumber !== undefined) dbUpdates.starting_number = updates.startingNumber
  if (updates.taxRate !== undefined) dbUpdates.tax_rate = updates.taxRate

  const { error } = await supabase
    .from('company_settings')
    .upsert({ user_id: user.id, ...dbUpdates }, { onConflict: 'user_id' })

  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}
