'use server'

import { Resend } from 'resend'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getInvoice } from './invoices'
import { getSettings } from './settings'
import { InvoicePDF } from '@/lib/pdf/invoice-pdf'
import { invoiceEmailHtml, invoiceEmailSubject } from '@/lib/email/invoice-email'

export async function sendInvoiceEmail(invoiceId: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { success: false, error: 'RESEND_API_KEY non configurée' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const [invoice, settings] = await Promise.all([getInvoice(invoiceId), getSettings()])
  if (!invoice) return { success: false, error: 'Facture introuvable' }
  if (!invoice.customerEmail) return { success: false, error: 'Le client n\'a pas d\'adresse email' }

  const element = createElement(InvoicePDF, { invoice, settings }) as ReactElement<DocumentProps>
  const pdfBuffer = await renderToBuffer(element)

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: settings.email || 'factures@moufacture.com',
    to: invoice.customerEmail,
    subject: invoiceEmailSubject(invoice, settings),
    html: invoiceEmailHtml(invoice, settings),
    attachments: [
      {
        filename: `${invoice.id}.pdf`,
        content: pdfBuffer,
      },
    ],
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}
