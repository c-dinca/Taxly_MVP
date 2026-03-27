import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export interface InvoicePDFProps {
  type: 'factura' | 'nota_credit' | 'proforma' | 'deviz' | 'avans' | 'storno'
  number: string
  issueDate: string
  dueDate?: string
  currency: string
  client: {
    name: string
    cui?: string
    regCom?: string
    address?: string
    city?: string
    county?: string
  }
  emitent: {
    name: string
    cui?: string
    regCom?: string
    address?: string
  }
  lines: Array<{
    description: string
    unit?: string
    quantity: number
    unitPriceHT: number
    tvaRate: number
    remise?: number
  }>
  remiseGenerala?: number
  acomptes?: number
  mentiuni?: string
  originalInvoiceNumber?: string
}

const ACCENT = '#002B67'
const TEXT = '#0D1B3E'
const MUTED = '#5A6A8A'
const LIGHT_BG = '#F4F6FB'
const BORDER = '#E2EAF4'

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: TEXT, padding: '32 36 32 36', lineHeight: 1.4 },
  // Header
  header: { backgroundColor: ACCENT, padding: '14 18', marginHorizontal: -36, marginTop: -32, marginBottom: 18 },
  headerTitle: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
  headerSub: { color: '#A8BFDF', fontSize: 7.5, marginTop: 2, letterSpacing: 0.8 },
  headerRight: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Helvetica-Bold', opacity: 0.75, textAlign: 'right' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  // Credit note banner
  creditBanner: { backgroundColor: '#FEF3C7', borderColor: '#F59E0B', borderWidth: 0.5, borderRadius: 4, padding: '6 10', marginBottom: 10 },
  creditBannerText: { color: '#92400E', fontSize: 8, fontFamily: 'Helvetica-Bold' },
  // Meta
  metaRow: { flexDirection: 'row', gap: 18, marginBottom: 12, paddingBottom: 10, borderBottomColor: BORDER, borderBottomWidth: 0.5 },
  metaBlock: {},
  metaLabel: { color: MUTED, fontSize: 7, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  metaValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: TEXT },
  // Parties
  partiesRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  partyBlock: { flex: 1, backgroundColor: LIGHT_BG, borderRadius: 4, padding: '8 10' },
  partyLabel: { color: MUTED, fontSize: 7, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  partyName: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: TEXT, marginBottom: 2 },
  partyDetail: { color: MUTED, fontSize: 8, lineHeight: 1.5 },
  // Table
  tableHeader: { flexDirection: 'row', backgroundColor: ACCENT, borderRadius: 3, padding: '5 6', marginBottom: 1 },
  tableRow: { flexDirection: 'row', borderBottomColor: BORDER, borderBottomWidth: 0.5, padding: '4 6' },
  tableRowAlt: { flexDirection: 'row', backgroundColor: LIGHT_BG, borderBottomColor: BORDER, borderBottomWidth: 0.5, padding: '4 6' },
  thText: { color: '#FFFFFF', fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
  tdText: { color: TEXT, fontSize: 8 },
  // Column widths
  colNr: { width: 22 },
  colDesc: { flex: 1 },
  colUm: { width: 32 },
  colQty: { width: 38, textAlign: 'right' },
  colPret: { width: 52, textAlign: 'right' },
  colTva: { width: 36, textAlign: 'right' },
  colValHT: { width: 52, textAlign: 'right' },
  colTvaVal: { width: 48, textAlign: 'right' },
  colTotal: { width: 54, textAlign: 'right' },
  // Totals
  totalsSection: { marginTop: 10, borderTopColor: BORDER, borderTopWidth: 0.5, paddingTop: 8 },
  totalsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 3 },
  totalsLabel: { color: MUTED, fontSize: 8, width: 180, textAlign: 'right', paddingRight: 10 },
  totalsValue: { fontSize: 8, width: 80, textAlign: 'right', fontFamily: 'Helvetica-Bold', color: TEXT },
  totalsDivider: { borderTopColor: TEXT, borderTopWidth: 1, marginTop: 4, marginBottom: 4 },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 2 },
  grandTotalLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: TEXT, width: 180, textAlign: 'right', paddingRight: 10 },
  grandTotalValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: ACCENT, width: 80, textAlign: 'right' },
  restRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6, backgroundColor: ACCENT, borderRadius: 4, padding: '6 10' },
  restLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', width: 180, textAlign: 'right', paddingRight: 10 },
  restValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', width: 80, textAlign: 'right' },
  // Notes
  notesSection: { marginTop: 14, borderTopColor: BORDER, borderTopWidth: 0.5, paddingTop: 8 },
  notesLabel: { color: MUTED, fontSize: 7, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  notesText: { color: MUTED, fontSize: 8, lineHeight: 1.6 },
  // Footer
  footer: { marginTop: 18, borderTopColor: BORDER, borderTopWidth: 0.5, paddingTop: 6, textAlign: 'center' },
  footerText: { color: '#8FA3C0', fontSize: 7, textAlign: 'center' },
})

const TYPE_LABELS: Record<string, string> = {
  factura: 'FACTURĂ FISCALĂ',
  nota_credit: 'NOTĂ DE CREDIT',
  proforma: 'FACTURĂ PROFORMĂ',
  deviz: 'DEVIZ',
  avans: 'FACTURĂ DE AVANS',
  storno: 'FACTURĂ STORNO',
}

function fmt(n: number): string {
  return n.toFixed(2)
}

function fmtDate(d: string): string {
  if (!d) return '—'
  const parts = d.split('-')
  if (parts.length !== 3) return d
  return `${parts[2]}.${parts[1]}.${parts[0]}`
}

export function InvoicePDF({
  type, number, issueDate, dueDate, currency,
  client, emitent, lines, remiseGenerala = 0,
  acomptes = 0, mentiuni, originalInvoiceNumber,
}: InvoicePDFProps) {
  // Line calculations
  const lineCalcs = lines.map(l => {
    const baseHT = l.quantity * l.unitPriceHT
    const remiseAmt = baseHT * ((l.remise ?? 0) / 100)
    const netHT = baseHT - remiseAmt
    const tvaAmt = netHT * (l.tvaRate / 100)
    return { baseHT, remiseAmt, netHT, tvaAmt, totalTTC: netHT + tvaAmt }
  })

  const totalHTBrut = lineCalcs.reduce((s, c) => s + c.baseHT, 0)
  const totalHTNetLinii = lineCalcs.reduce((s, c) => s + c.netHT, 0)
  const remiseGeneralaAmount = totalHTNetLinii * (remiseGenerala / 100)
  const totalHTNet = totalHTNetLinii - remiseGeneralaAmount
  const factor = 1 - remiseGenerala / 100

  // TVA breakdown by rate
  const tvaByRate: Record<number, number> = {}
  lines.forEach((l, i) => {
    const adjustedNet = lineCalcs[i].netHT * factor
    tvaByRate[l.tvaRate] = (tvaByRate[l.tvaRate] ?? 0) + adjustedNet * (l.tvaRate / 100)
  })
  const totalTVA = Object.values(tvaByRate).reduce((s, v) => s + v, 0)
  const totalTTC = totalHTNet + totalTVA
  const restDeAchitat = totalTTC - acomptes

  const hasRemise = remiseGenerala > 0 || lines.some(l => (l.remise ?? 0) > 0)
  const hasAcomptes = acomptes > 0

  return (
    <Document
      title={`${TYPE_LABELS[type] ?? 'FACTURĂ'} ${number}`}
      author="Taxly"
      creator="Taxly"
    >
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <View>
              <Text style={s.headerTitle}>{TYPE_LABELS[type] ?? 'FACTURĂ FISCALĂ'}</Text>
              <Text style={s.headerSub}>Document fiscal român</Text>
            </View>
            <View>
              <Text style={s.headerRight}>{number}</Text>
            </View>
          </View>
        </View>

        {/* Credit note banner */}
        {(type === 'nota_credit' || type === 'storno') && originalInvoiceNumber && (
          <View style={s.creditBanner}>
            <Text style={s.creditBannerText}>
              Notă de credit pentru factura {originalInvoiceNumber}
            </Text>
          </View>
        )}

        {/* Meta */}
        <View style={s.metaRow}>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Data emiterii</Text>
            <Text style={s.metaValue}>{fmtDate(issueDate)}</Text>
          </View>
          {dueDate && (
            <View style={s.metaBlock}>
              <Text style={s.metaLabel}>Scadență</Text>
              <Text style={s.metaValue}>{fmtDate(dueDate)}</Text>
            </View>
          )}
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Valută</Text>
            <Text style={s.metaValue}>{currency}</Text>
          </View>
        </View>

        {/* Parties */}
        <View style={s.partiesRow}>
          <View style={s.partyBlock}>
            <Text style={s.partyLabel}>Emitent (Furnizor)</Text>
            <Text style={s.partyName}>{emitent.name}</Text>
            {emitent.cui && <Text style={s.partyDetail}>CUI: {emitent.cui}</Text>}
            {emitent.regCom && <Text style={s.partyDetail}>Reg. Com.: {emitent.regCom}</Text>}
            {emitent.address && <Text style={s.partyDetail}>{emitent.address}</Text>}
          </View>
          <View style={s.partyBlock}>
            <Text style={s.partyLabel}>Client (Beneficiar)</Text>
            <Text style={s.partyName}>{client.name}</Text>
            {client.cui && <Text style={s.partyDetail}>CUI: {client.cui}</Text>}
            {client.regCom && <Text style={s.partyDetail}>Reg. Com.: {client.regCom}</Text>}
            {client.address && <Text style={s.partyDetail}>{client.address}</Text>}
            {(client.city || client.county) && (
              <Text style={s.partyDetail}>{[client.city, client.county].filter(Boolean).join(', ')}</Text>
            )}
          </View>
        </View>

        {/* Line items table */}
        {lines.length > 0 && (
          <View>
            <View style={s.tableHeader}>
              <Text style={[s.thText, s.colNr]}>Nr.</Text>
              <Text style={[s.thText, s.colDesc]}>Descriere</Text>
              <Text style={[s.thText, s.colUm]}>UM</Text>
              <Text style={[s.thText, s.colQty]}>Cant.</Text>
              <Text style={[s.thText, s.colPret]}>Preț HT</Text>
              <Text style={[s.thText, s.colTva]}>TVA %</Text>
              <Text style={[s.thText, s.colValHT]}>Val. HT</Text>
              <Text style={[s.thText, s.colTvaVal]}>TVA</Text>
              <Text style={[s.thText, s.colTotal]}>Total</Text>
            </View>
            {lines.map((l, i) => {
              const c = lineCalcs[i]
              const rowStyle = i % 2 === 0 ? s.tableRow : s.tableRowAlt
              return (
                <View key={i} style={rowStyle}>
                  <Text style={[s.tdText, s.colNr]}>{i + 1}</Text>
                  <Text style={[s.tdText, s.colDesc]}>{l.description}</Text>
                  <Text style={[s.tdText, s.colUm]}>{l.unit ?? 'buc'}</Text>
                  <Text style={[s.tdText, s.colQty]}>{l.quantity}</Text>
                  <Text style={[s.tdText, s.colPret]}>{fmt(l.unitPriceHT)}</Text>
                  <Text style={[s.tdText, s.colTva]}>{l.tvaRate}%</Text>
                  <Text style={[s.tdText, s.colValHT]}>{fmt(c.netHT)}</Text>
                  <Text style={[s.tdText, s.colTvaVal]}>{fmt(c.tvaAmt)}</Text>
                  <Text style={[s.tdText, s.colTotal]}>{fmt(c.totalTTC)}</Text>
                </View>
              )
            })}
          </View>
        )}

        {/* Totals */}
        <View style={s.totalsSection}>
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>Bază impozabilă (Total HT brut)</Text>
            <Text style={s.totalsValue}>{fmt(totalHTBrut)} {currency}</Text>
          </View>

          {hasRemise && remiseGenerala > 0 && (
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Remisă globală ({remiseGenerala}%)</Text>
              <Text style={[s.totalsValue, { color: '#EF4444' }]}>-{fmt(remiseGeneralaAmount)} {currency}</Text>
            </View>
          )}

          <View style={s.totalsRow}>
            <Text style={[s.totalsLabel, { fontFamily: 'Helvetica-Bold', color: TEXT }]}>Total bază impozabilă netă</Text>
            <Text style={[s.totalsValue, { color: TEXT }]}>{fmt(totalHTNet)} {currency}</Text>
          </View>

          {Object.entries(tvaByRate)
            .filter(([, v]) => Math.abs(v) > 0.001)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([rate, amount]) => (
              <View key={rate} style={s.totalsRow}>
                <Text style={s.totalsLabel}>TVA {rate}%</Text>
                <Text style={s.totalsValue}>{fmt(amount)} {currency}</Text>
              </View>
            ))}

          <View style={s.totalsDivider} />

          <View style={s.totalsRow}>
            <Text style={[s.totalsLabel, { fontFamily: 'Helvetica-Bold', color: TEXT }]}>Total TVA</Text>
            <Text style={[s.totalsValue, { color: TEXT }]}>{fmt(totalTVA)} {currency}</Text>
          </View>

          <View style={s.grandTotalRow}>
            <Text style={s.grandTotalLabel}>Total de plată (cu TVA)</Text>
            <Text style={s.grandTotalValue}>{fmt(totalTTC)} {currency}</Text>
          </View>

          {hasAcomptes && (
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Din care aconturi</Text>
              <Text style={[s.totalsValue, { color: '#10B981' }]}>-{fmt(acomptes)} {currency}</Text>
            </View>
          )}

          <View style={s.restRow}>
            <Text style={s.restLabel}>Rest de achitat</Text>
            <Text style={s.restValue}>{fmt(hasAcomptes ? restDeAchitat : totalTTC)} {currency}</Text>
          </View>
        </View>

        {/* Mentions */}
        {mentiuni && (
          <View style={s.notesSection}>
            <Text style={s.notesLabel}>Mențiuni</Text>
            <Text style={s.notesText}>{mentiuni}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>Document generat cu Taxly · taxly.ro</Text>
        </View>
      </Page>
    </Document>
  )
}
