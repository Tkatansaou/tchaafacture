import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getInvoice } from '@/lib/actions/invoices'
import { getSettings } from '@/lib/actions/settings'
import { InvoicePDF } from '@/lib/pdf/invoice-pdf'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const [invoice, settings] = await Promise.all([getInvoice(params.id), getSettings()])
  if (!invoice) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })

  const element = createElement(InvoicePDF, { invoice, settings }) as ReactElement<DocumentProps>
  const buffer = await renderToBuffer(element)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.id}.pdf"`,
    },
  })
}
