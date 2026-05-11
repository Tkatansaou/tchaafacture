'use client'

import { useState, useEffect } from 'react'
import { Invoice, Customer, CompanySettings } from './types'
import { mockInvoices, mockCustomers } from './mock-data'

const KEYS = {
  invoices: 'tf_invoices_v2',
  customers: 'tf_customers_v2',
  settings: 'tf_settings_v2',
}

export const defaultSettings: CompanySettings = {
  name: 'Ma Société',
  email: 'contact@masociete.com',
  phone: '+228 90 00 00 00',
  address: 'Lomé, Togo',
  logoUrl: '',
  currency: 'XOF',
  paymentTerms: 30,
  invoicePrefix: 'INV-',
  startingNumber: 1,
  taxRate: 18,
}

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {}
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices)

  useEffect(() => {
    setInvoices(load(KEYS.invoices, mockInvoices))
  }, [])

  const persist = (data: Invoice[]) => {
    setInvoices(data)
    save(KEYS.invoices, data)
  }

  return {
    invoices,
    addInvoice: (inv: Invoice) => persist([inv, ...invoices]),
    updateInvoice: (inv: Invoice) =>
      persist(invoices.map((i) => (i.id === inv.id ? inv : i))),
    deleteInvoice: (id: string) =>
      persist(invoices.filter((i) => i.id !== id)),
    nextInvoiceNumber: () => {
      const settings = load<CompanySettings>(KEYS.settings, defaultSettings)
      const count = invoices.length
      const num = settings.startingNumber + count
      return `${settings.invoicePrefix}${String(num).padStart(3, '0')}`
    },
  }
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers)

  useEffect(() => {
    setCustomers(load(KEYS.customers, mockCustomers))
  }, [])

  const persist = (data: Customer[]) => {
    setCustomers(data)
    save(KEYS.customers, data)
  }

  return {
    customers,
    addCustomer: (c: Customer) => persist([...customers, c]),
    updateCustomer: (c: Customer) =>
      persist(customers.map((x) => (x.id === c.id ? c : x))),
    deleteCustomer: (id: string) =>
      persist(customers.filter((c) => c.id !== id)),
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings)

  useEffect(() => {
    setSettings(load(KEYS.settings, defaultSettings))
  }, [])

  const updateSettings = (data: Partial<CompanySettings>) => {
    const updated = { ...settings, ...data }
    setSettings(updated)
    save(KEYS.settings, updated)
  }

  return { settings, updateSettings }
}
