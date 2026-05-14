import type { Invoice, CompanySettings } from '@/lib/types'

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n)
}

function fmtDate(str: string) {
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(str))
  } catch {
    return str
  }
}

export function invoiceEmailHtml(invoice: Invoice, settings: CompanySettings): string {
  const rows = invoice.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;">${item.description}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:center;color:#6b7280;">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:right;color:#6b7280;">${fmt(item.unitPrice)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:600;">${fmt(item.total)}</td>
      </tr>`,
    )
    .join('')

  const taxLine = invoice.taxRate > 0
    ? `<tr><td colspan="3" style="padding:6px 0;text-align:right;color:#6b7280;">${invoice.taxLabel} ${invoice.taxRate}%</td><td style="padding:6px 0;text-align:right;">${fmt(invoice.tax)}</td></tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,sans-serif;color:#111827;">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">

    <!-- Header -->
    <div style="background:#6366f1;padding:28px 32px;">
      <p style="margin:0;font-size:22px;font-weight:800;color:#fff;">${settings.name || 'mouFacture'}</p>
      <p style="margin:4px 0 0;color:rgba(255,255,255,.75);font-size:13px;">Facture ${invoice.id}</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 4px;font-size:15px;">Bonjour <strong>${invoice.customerName}</strong>,</p>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">
        Veuillez trouver ci-joint votre facture <strong>${invoice.id}</strong> d'un montant de
        <strong style="color:#6366f1;">${fmt(invoice.amount)}</strong>,
        avec une échéance au <strong>${fmtDate(invoice.dueDate)}</strong>.
      </p>

      <!-- Tableau -->
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#9ca3af;letter-spacing:.05em;">Description</th>
            <th style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#9ca3af;letter-spacing:.05em;">Qté</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;color:#9ca3af;letter-spacing:.05em;">Prix HT</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;color:#9ca3af;letter-spacing:.05em;">Total HT</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr><td colspan="3" style="padding:10px 0;text-align:right;color:#6b7280;border-top:1px solid #e5e7eb;">Sous-total HT</td><td style="padding:10px 0;text-align:right;border-top:1px solid #e5e7eb;">${fmt(invoice.subtotal)}</td></tr>
          ${taxLine}
          <tr style="background:#f0f4ff;border-radius:8px;">
            <td colspan="3" style="padding:12px;font-weight:700;">Total TTC</td>
            <td style="padding:12px;text-align:right;font-weight:700;color:#6366f1;">${fmt(invoice.amount)}</td>
          </tr>
        </tfoot>
      </table>

      ${invoice.notes ? `<div style="background:#f9fafb;border-radius:8px;padding:14px;font-size:13px;color:#6b7280;margin-top:8px;"><strong style="display:block;margin-bottom:4px;color:#374151;">Notes</strong>${invoice.notes}</div>` : ''}

      <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">
        En cas de question, n'hésitez pas à nous contacter à
        <a href="mailto:${settings.email}" style="color:#6366f1;">${settings.email}</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#9ca3af;">
      ${settings.name}${settings.phone ? ` · ${settings.phone}` : ''}${settings.address ? ` · ${settings.address}` : ''}
    </div>
  </div>
</body>
</html>`
}

export function invoiceEmailSubject(invoice: Invoice, settings: CompanySettings): string {
  return `Facture ${invoice.id} — ${settings.name}`
}
