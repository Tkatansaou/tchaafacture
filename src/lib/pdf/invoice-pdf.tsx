import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Invoice, CompanySettings } from '@/lib/types'

const PRIMARY = '#6366f1'
const MUTED = '#6b7280'
const BORDER = '#e5e7eb'
const BG_LIGHT = '#f9fafb'

const s = StyleSheet.create({
  page: { padding: 48, fontFamily: 'Helvetica', fontSize: 10, color: '#111827', lineHeight: 1.5 },
  row: { flexDirection: 'row' },
  spaceBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  divider: { borderBottomWidth: 1, borderBottomColor: BORDER, marginVertical: 20 },
  label: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1, color: '#9ca3af', marginBottom: 6 },
  muted: { color: MUTED },
  bold: { fontFamily: 'Helvetica-Bold' },
  primary: { color: PRIMARY },
  tableHeader: { flexDirection: 'row', backgroundColor: BG_LIGHT, paddingVertical: 7, paddingHorizontal: 8 },
  tableRow: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  col1: { flex: 1 },
  col2: { width: 40, textAlign: 'center' },
  col3: { width: 100, textAlign: 'right' },
  col4: { width: 100, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalBox: { backgroundColor: '#f0f4ff', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 4, flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  noteBox: { backgroundColor: BG_LIGHT, padding: 12, borderRadius: 4, marginTop: 24 },
})

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n)
}

function fmtDate(str: string) {
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(str))
  } catch {
    return str
  }
}

interface Props {
  invoice: Invoice
  settings: CompanySettings
}

export function InvoicePDF({ invoice, settings }: Props) {
  return (
    <Document title={`Facture ${invoice.id}`} author={settings.name}>
      <Page size="A4" style={s.page}>
        {/* En-tête */}
        <View style={s.spaceBetween}>
          <View>
            <Text style={[s.bold, { fontSize: 16, color: PRIMARY }]}>{settings.name || 'Mon Entreprise'}</Text>
            {!!settings.email && <Text style={[s.muted, { marginTop: 4 }]}>{settings.email}</Text>}
            {!!settings.phone && <Text style={s.muted}>{settings.phone}</Text>}
            {!!settings.address && <Text style={s.muted}>{settings.address}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[s.bold, { fontSize: 20 }]}>FACTURE</Text>
            <Text style={[s.muted, { fontFamily: 'Courier', marginTop: 4 }]}>{invoice.id}</Text>
            <Text style={[s.muted, { marginTop: 4 }]}>Date : {fmtDate(invoice.date)}</Text>
            <Text style={s.muted}>Échéance : {fmtDate(invoice.dueDate)}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Facturer à */}
        <View style={{ marginBottom: 20 }}>
          <Text style={s.label}>Facturer à</Text>
          <Text style={[s.bold, { fontSize: 11 }]}>{invoice.customerName}</Text>
          {!!invoice.customerCompany && <Text style={[s.muted, { marginTop: 2 }]}>{invoice.customerCompany}</Text>}
          {!!invoice.customerEmail && <Text style={s.muted}>{invoice.customerEmail}</Text>}
          {!!invoice.customerPhone && <Text style={s.muted}>{invoice.customerPhone}</Text>}
          {!!invoice.customerAddress && <Text style={s.muted}>{invoice.customerAddress}</Text>}
        </View>

        <View style={s.divider} />

        {/* Tableau des lignes */}
        <View style={s.tableHeader}>
          <Text style={[s.col1, s.label, { marginBottom: 0 }]}>Description</Text>
          <Text style={[s.col2, s.label, { marginBottom: 0 }]}>Qté</Text>
          <Text style={[s.col3, s.label, { marginBottom: 0 }]}>Prix HT</Text>
          <Text style={[s.col4, s.label, { marginBottom: 0 }]}>Total HT</Text>
        </View>

        {invoice.items.map((item, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={s.col1}>{item.description}</Text>
            <Text style={[s.col2, s.muted]}>{item.quantity}</Text>
            <Text style={[s.col3, s.muted]}>{fmt(item.unitPrice)}</Text>
            <Text style={[s.col4, s.bold]}>{fmt(item.total)}</Text>
          </View>
        ))}

        {/* Totaux */}
        <View style={{ marginTop: 20, alignSelf: 'flex-end', width: 230 }}>
          <View style={s.totalRow}>
            <Text style={s.muted}>Sous-total HT</Text>
            <Text>{fmt(invoice.subtotal)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.muted}>{invoice.taxLabel}{invoice.taxRate > 0 ? ` ${invoice.taxRate}%` : ''}</Text>
            <Text>{fmt(invoice.tax)}</Text>
          </View>
          <View style={s.totalBox}>
            <Text style={s.bold}>Total TTC</Text>
            <Text style={[s.bold, s.primary]}>{fmt(invoice.amount)}</Text>
          </View>
        </View>

        {/* Notes */}
        {!!invoice.notes && (
          <View style={s.noteBox}>
            <Text style={s.label}>Notes</Text>
            <Text style={s.muted}>{invoice.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  )
}
