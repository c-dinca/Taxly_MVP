import { Document, Font, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import path from 'path'

// Register Unicode-capable fonts so Romanian diacritics (ă â î ș ț) render correctly.
// Standard PDF fonts (Helvetica, Courier) are Latin-1 only and strip diacritics.
const fontsDir = path.join(process.cwd(), 'public', 'fonts')
Font.register({
  family: 'Roboto',
  fonts: [
    { src: path.join(fontsDir, 'Roboto-Regular.ttf'), fontWeight: 400 },
    { src: path.join(fontsDir, 'Roboto-Bold.ttf'),    fontWeight: 700 },
  ],
})
Font.register({
  family: 'RobotoMono',
  fonts: [
    { src: path.join(fontsDir, 'RobotoMono-Regular.ttf'), fontWeight: 400 },
    { src: path.join(fontsDir, 'RobotoMono-Bold.ttf'),    fontWeight: 700 },
  ],
})
// Disable hyphenation — react-pdf hyphenates Romanian words aggressively otherwise
Font.registerHyphenationCallback(word => [word])

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
    iban?: string
    bank?: string
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

// ─── Color per document type ───────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { title: string; subtitle: string; accent: string }> = {
  factura:     { title: 'FACTURĂ FISCALĂ',   subtitle: 'conf. art. 319 din Legea nr. 227/2015 privind Codul fiscal', accent: '#004AAD' },
  nota_credit: { title: 'FACTURĂ STORNO',    subtitle: 'Notă de credit · conf. art. 330 din Legea nr. 227/2015',    accent: '#B91C1C' },
  storno:      { title: 'FACTURĂ STORNO',    subtitle: 'Notă de credit · conf. art. 330 din Legea nr. 227/2015',    accent: '#B91C1C' },
  proforma:    { title: 'FACTURĂ PROFORMĂ',  subtitle: 'Document fără valoare fiscală',                             accent: '#475569' },
  deviz:       { title: 'DEVIZ / OFERTĂ',    subtitle: 'Document estimativ de costuri',                             accent: '#3730A3' },
  avans:       { title: 'FACTURĂ DE AVANS',  subtitle: 'conf. art. 319 din Legea nr. 227/2015 privind Codul fiscal', accent: '#0F766E' },
}

const LEGAL_TEXT: Record<string, string> = {
  factura:     'Prezenta factură este documentul fiscal emis în conformitate cu art. 319 din Legea nr. 227/2015 privind Codul fiscal, cu modificările și completările ulterioare.',
  nota_credit: 'Prezenta notă de credit (factură storno) este emisă în conformitate cu art. 330 din Legea nr. 227/2015 privind Codul fiscal. Documentul reduce/anulează obligațiile fiscale ale facturii de referință.',
  storno:      'Prezenta notă de credit (factură storno) este emisă în conformitate cu art. 330 din Legea nr. 227/2015 privind Codul fiscal. Documentul reduce/anulează obligațiile fiscale ale facturii de referință.',
  proforma:    'Factura proformă nu reprezintă un document fiscal și nu generează obligații de TVA. Este valabilă ca ofertă comercială până la emiterea facturii fiscale.',
  deviz:       'Prezentul deviz este o estimare a costurilor și nu generează obligații fiscale. Prețurile sunt orientative și pot fi modificate la emiterea facturii fiscale.',
  avans:       'Prezenta factură de avans este documentul fiscal emis în conformitate cu art. 319 din Legea nr. 227/2015 privind Codul fiscal, cu modificările și completările ulterioare.',
}

// ─── Shared palette ────────────────────────────────────────────────────────
const TEXT    = '#0D1B3E'
const MUTED   = '#5A6A8A'
const FAINT   = '#8FA3C0'
const BORDER  = '#E2EAF4'
const LIGHT   = '#F4F6FB'
const RED     = '#DC2626'
const GREEN   = '#059669'

// ─── Styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 8.5,
    color: TEXT,
    paddingTop: 0,
    paddingBottom: 36,
    paddingHorizontal: 0,
    lineHeight: 1.45,
  },

  // Header (full-bleed, colored by type)
  header: {
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 18,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTypeTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Roboto',
    fontWeight: 700,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  headerTypeSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 7,
    letterSpacing: 0.5,
  },
  headerNumber: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'RobotoMono', fontWeight: 700,
    textAlign: 'right',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  headerMeta: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 7.5,
    textAlign: 'right',
  },

  // Credit note banner
  creditBanner: {
    marginHorizontal: 32,
    marginTop: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 0.5,
    borderColor: '#FCA5A5',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  creditBannerText: {
    color: '#991B1B',
    fontSize: 8,
    fontFamily: 'Roboto',
    fontWeight: 700,
  },

  // Content wrapper
  content: {
    paddingHorizontal: 32,
    paddingTop: 14,
  },

  // Parties
  partiesRow: {
    flexDirection: 'row',
    borderWidth: 0.5,
    borderColor: BORDER,
    borderRadius: 4,
    marginBottom: 14,
    overflow: 'hidden',
  },
  partyBlock: { flex: 1, paddingVertical: 10, paddingHorizontal: 12 },
  partyDivider: { width: 0.5, backgroundColor: BORDER },
  partyRoleLabel: {
    fontSize: 6.5,
    fontFamily: 'Roboto',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 5,
  },
  partyName: {
    fontSize: 9.5,
    fontFamily: 'Roboto',
    fontWeight: 700,
    color: TEXT,
    marginBottom: 3,
  },
  partyDetail: {
    fontSize: 7.5,
    color: MUTED,
    lineHeight: 1.55,
  },
  partyDetailLabel: {
    color: FAINT,
  },

  // Table
  tableWrapper: { marginBottom: 10 },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    alignItems: 'center',
  },
  thText: { color: '#FFFFFF', fontSize: 9, fontFamily: 'Roboto', fontWeight: 700 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    alignItems: 'center',
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    backgroundColor: LIGHT,
    alignItems: 'center',
  },
  tdText: { fontSize: 9, color: TEXT },
  tdMono: { fontSize: 9, color: TEXT, fontFamily: 'RobotoMono' },
  tdMuted: { fontSize: 9, color: MUTED },
  tdRed: { fontSize: 9, color: RED },

  // Column widths — sized so no header text wraps on A4 (531pt content width)
  cNr:   { width: 16 },
  cDesc: { flex: 1 },
  cUm:   { width: 26, textAlign: 'center' },
  cQty:  { width: 30, textAlign: 'right' },
  cPret: { width: 52, textAlign: 'right' },
  cDisc: { width: 24, textAlign: 'right' },
  cTva:  { width: 30, textAlign: 'right' },
  cVal:  { width: 54, textAlign: 'right' },

  // Totals
  totalsSection: { marginTop: 6, alignItems: 'flex-end' },
  totalsInner: { width: 240 },
  tRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2.5 },
  tLabel: { fontSize: 8, color: MUTED, flex: 1, textAlign: 'right', paddingRight: 8 },
  tValue: { fontSize: 8, fontFamily: 'RobotoMono', color: TEXT, width: 80, textAlign: 'right' },
  tLabelSemi: { fontSize: 8, color: TEXT, fontFamily: 'Roboto', fontWeight: 700, flex: 1, textAlign: 'right', paddingRight: 8 },
  tValueSemi: { fontSize: 8, fontFamily: 'RobotoMono', fontWeight: 700, color: TEXT, width: 80, textAlign: 'right' },
  tLabelRed: { fontSize: 8, color: RED, flex: 1, textAlign: 'right', paddingRight: 8 },
  tValueRed: { fontSize: 8, fontFamily: 'RobotoMono', color: RED, width: 80, textAlign: 'right' },
  tLabelGreen: { fontSize: 8, color: GREEN, flex: 1, textAlign: 'right', paddingRight: 8 },
  tValueGreen: { fontSize: 8, fontFamily: 'RobotoMono', color: GREEN, width: 80, textAlign: 'right' },
  tDivider: { borderTopWidth: 0.5, borderTopColor: BORDER, marginVertical: 4 },
  tDividerStrong: { borderTopWidth: 1, borderTopColor: TEXT, marginVertical: 5 },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  grandTotalLabel: { fontSize: 9.5, fontFamily: 'Roboto', fontWeight: 700, color: TEXT, flex: 1, textAlign: 'right', paddingRight: 8 },
  grandTotalValue: { fontSize: 11, fontFamily: 'RobotoMono', fontWeight: 700, color: TEXT, width: 80, textAlign: 'right' },
  restRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  restLabel: { fontSize: 9.5, fontFamily: 'Roboto', fontWeight: 700, color: '#FFFFFF', flex: 1, textAlign: 'right', paddingRight: 8 },
  restValue: { fontSize: 11, fontFamily: 'RobotoMono', fontWeight: 700, color: '#FFFFFF', width: 80, textAlign: 'right' },

  // Legal text
  legalSection: {
    marginTop: 14,
    backgroundColor: LIGHT,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  legalText: { fontSize: 7, color: FAINT, lineHeight: 1.6 },

  // Notes
  notesSection: { marginTop: 10 },
  notesLabel: {
    fontSize: 6.5,
    fontFamily: 'Roboto',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    color: FAINT,
    marginBottom: 3,
  },
  notesText: { fontSize: 7.5, color: MUTED, lineHeight: 1.6 },

  // Signatures
  signRow: { flexDirection: 'row', gap: 20, marginTop: 16 },
  signBlock: { flex: 1 },
  signLabel: {
    fontSize: 6.5,
    fontFamily: 'Roboto',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    color: FAINT,
    marginBottom: 20,
  },
  signLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    borderBottomStyle: 'dashed',
    marginBottom: 4,
  },
  signName: { fontSize: 7.5, color: FAINT },

  // Footer
  footer: {
    marginTop: 18,
    paddingTop: 8,
    paddingHorizontal: 32,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: '#C8D5E8', textTransform: 'uppercase', letterSpacing: 0.8 },
})

// ─── Helpers ───────────────────────────────────────────────────────────────
function fmt(n: number): string {
  return n.toFixed(2)
}

function fmtDate(d: string): string {
  if (!d) return '—'
  const parts = d.split('-')
  if (parts.length !== 3) return d
  return `${parts[2]}.${parts[1]}.${parts[0]}`
}

// ─── Component ─────────────────────────────────────────────────────────────
export function InvoicePDF({
  type, number, issueDate, dueDate, currency,
  client, emitent, lines, remiseGenerala = 0,
  acomptes = 0, mentiuni, originalInvoiceNumber,
}: InvoicePDFProps) {
  const cfg   = TYPE_CONFIG[type] ?? TYPE_CONFIG['factura']
  const legal = LEGAL_TEXT[type]  ?? LEGAL_TEXT['factura']
  const isStorno = type === 'storno' || type === 'nota_credit'

  // ── Calculations ──
  const lineCalcs = lines.map(l => {
    const baseHT   = l.quantity * l.unitPriceHT
    const remiseAmt = baseHT * ((l.remise ?? 0) / 100)
    const netHT    = baseHT - remiseAmt
    const tvaAmt   = netHT * (l.tvaRate / 100)
    return { baseHT, remiseAmt, netHT, tvaAmt }
  })

  const totalHTBrut      = lineCalcs.reduce((s, c) => s + c.baseHT, 0)
  const totalRemiseLinii = lineCalcs.reduce((s, c) => s + c.remiseAmt, 0)
  const totalHTNetLinii  = lineCalcs.reduce((s, c) => s + c.netHT, 0)
  const remiseGeneralaAmount = totalHTNetLinii * (remiseGenerala / 100)
  const totalHTNet = totalHTNetLinii - remiseGeneralaAmount
  const factor     = 1 - remiseGenerala / 100

  const tvaByRate: Record<number, { base: number; tva: number }> = {}
  lines.forEach((l, i) => {
    const base = lineCalcs[i].netHT * factor
    const tva  = base * (l.tvaRate / 100)
    if (!tvaByRate[l.tvaRate]) tvaByRate[l.tvaRate] = { base: 0, tva: 0 }
    tvaByRate[l.tvaRate].base += base
    tvaByRate[l.tvaRate].tva  += tva
  })
  const totalTVA  = Object.values(tvaByRate).reduce((s, v) => s + v.tva, 0)
  const totalTTC  = totalHTNet + totalTVA
  const restDeAchitat = totalTTC - acomptes

  const hasRemise   = remiseGenerala > 0 || lines.some(l => (l.remise ?? 0) > 0)
  const hasAcomptes = acomptes > 0
  const displayTotal = hasAcomptes ? restDeAchitat : totalTTC

  return (
    <Document
      title={`${cfg.title} ${number}`}
      author="Taxly"
      creator="Taxly"
    >
      <Page size="A4" style={s.page}>

        {/* ── Header (full-bleed color strip) ── */}
        <View style={[s.header, { backgroundColor: cfg.accent }]}>
          <View style={s.headerRow}>
            <View>
              <Text style={s.headerTypeTitle}>{cfg.title}</Text>
              <Text style={s.headerTypeSub}>{cfg.subtitle}</Text>
            </View>
            <View>
              <Text style={s.headerNumber}>{number}</Text>
              <Text style={s.headerMeta}>
                {fmtDate(issueDate)}
                {dueDate ? `  ·  scad. ${fmtDate(dueDate)}` : ''}
                {'  ·  '}{currency}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Credit note banner ── */}
        {isStorno && originalInvoiceNumber && (
          <View style={s.creditBanner}>
            <Text style={s.creditBannerText}>
              Notă de credit emisă pentru factura {originalInvoiceNumber}
            </Text>
          </View>
        )}

        {/* ── Content ── */}
        <View style={s.content}>

          {/* ── Furnizor / Beneficiar ── */}
          <View style={s.partiesRow}>
            {/* Furnizor */}
            <View style={s.partyBlock}>
              <Text style={[s.partyRoleLabel, { color: cfg.accent }]}>Furnizor</Text>
              <Text style={s.partyName}>{emitent.name}</Text>
              {emitent.address && (
                <Text style={s.partyDetail}>
                  <Text style={s.partyDetailLabel}>Adresă: </Text>{emitent.address}
                </Text>
              )}
              {emitent.cui && (
                <Text style={s.partyDetail}>
                  <Text style={s.partyDetailLabel}>CUI: </Text>{emitent.cui}
                </Text>
              )}
              {emitent.regCom && (
                <Text style={s.partyDetail}>
                  <Text style={s.partyDetailLabel}>Reg. Com.: </Text>{emitent.regCom}
                </Text>
              )}
              {emitent.iban && (
                <Text style={s.partyDetail}>
                  <Text style={s.partyDetailLabel}>IBAN: </Text>{emitent.iban}
                </Text>
              )}
              {emitent.bank && (
                <Text style={s.partyDetail}>
                  <Text style={s.partyDetailLabel}>Bancă: </Text>{emitent.bank}
                </Text>
              )}
            </View>

            <View style={s.partyDivider} />

            {/* Beneficiar */}
            <View style={s.partyBlock}>
              <Text style={[s.partyRoleLabel, { color: FAINT }]}>Beneficiar / Client</Text>
              <Text style={s.partyName}>{client.name}</Text>
              {client.address && (
                <Text style={s.partyDetail}>
                  <Text style={s.partyDetailLabel}>Adresă: </Text>{client.address}
                </Text>
              )}
              {(client.city || client.county) && (
                <Text style={s.partyDetail}>
                  {[client.city, client.county].filter(Boolean).join(', ')}
                </Text>
              )}
              {client.cui && (
                <Text style={s.partyDetail}>
                  <Text style={s.partyDetailLabel}>CUI: </Text>{client.cui}
                </Text>
              )}
              {client.regCom && (
                <Text style={s.partyDetail}>
                  <Text style={s.partyDetailLabel}>Reg. Com.: </Text>{client.regCom}
                </Text>
              )}
            </View>
          </View>

          {/* ── Line items table ── */}
          {lines.length > 0 && (
            <View style={s.tableWrapper}>
              {/* Table header */}
              <View style={[s.tableHeader, { backgroundColor: cfg.accent }]}>
                <Text style={[s.thText, s.cNr]}>#</Text>
                <Text style={[s.thText, s.cDesc]}>Denumire produs / serviciu</Text>
                <Text style={[s.thText, s.cUm]}>U.M.</Text>
                <Text style={[s.thText, s.cQty]}>Cant.</Text>
                <Text style={[s.thText, s.cPret]}>Preț unit.</Text>
                <Text style={[s.thText, s.cDisc]}>Disc.</Text>
                <Text style={[s.thText, s.cTva]}>TVA %</Text>
                <Text style={[s.thText, s.cVal]}>Val. fără TVA</Text>
              </View>

              {lines.map((l, i) => {
                const c = lineCalcs[i]
                const isNeg = l.unitPriceHT < 0 || c.netHT < 0
                const rowStyle = i % 2 === 1 ? s.tableRowAlt : s.tableRow
                const numColor = isNeg || isStorno ? RED : TEXT
                return (
                  <View key={i} style={rowStyle}>
                    <Text style={[s.tdMuted, s.cNr]}>{i + 1}</Text>
                    <Text style={[s.tdText, s.cDesc]}>{l.description}</Text>
                    <Text style={[s.tdMuted, s.cUm]}>{l.unit ?? 'buc'}</Text>
                    <Text style={[s.tdMono, s.cQty, { color: numColor }]}>{l.quantity}</Text>
                    <Text style={[s.tdMono, s.cPret, { color: numColor }]}>{fmt(l.unitPriceHT)}</Text>
                    <Text style={[s.tdText, s.cDisc]}>
                      {(l.remise ?? 0) > 0
                        ? <Text style={{ color: RED }}>{l.remise}%</Text>
                        : <Text style={{ color: FAINT }}>—</Text>}
                    </Text>
                    <Text style={[s.tdMuted, s.cTva]}>{l.tvaRate}%</Text>
                    <Text style={[s.tdMono, s.cVal, { color: numColor, fontFamily: 'RobotoMono', fontWeight: 700 }]}>
                      {fmt(c.netHT)}
                    </Text>
                  </View>
                )
              })}
            </View>
          )}

          {/* ── Totals ── */}
          <View style={s.totalsSection}>
            <View style={s.totalsInner}>

              {/* Subtotal brut */}
              <View style={s.tRow}>
                <Text style={s.tLabel}>Valoare totală fără TVA</Text>
                <Text style={s.tValue}>{fmt(totalHTBrut)} {currency}</Text>
              </View>

              {/* Discounts */}
              {hasRemise && (
                <>
                  {totalRemiseLinii > 0 && (
                    <View style={s.tRow}>
                      <Text style={s.tLabelRed}>Reduceri comerciale (pe linii)</Text>
                      <Text style={s.tValueRed}>−{fmt(totalRemiseLinii)} {currency}</Text>
                    </View>
                  )}
                  {remiseGenerala > 0 && (
                    <View style={s.tRow}>
                      <Text style={s.tLabelRed}>Reducere comercială globală ({remiseGenerala}%)</Text>
                      <Text style={s.tValueRed}>−{fmt(remiseGeneralaAmount)} {currency}</Text>
                    </View>
                  )}
                  <View style={s.tRow}>
                    <Text style={s.tLabelSemi}>Bază impozabilă netă</Text>
                    <Text style={s.tValueSemi}>{fmt(totalHTNet)} {currency}</Text>
                  </View>
                </>
              )}

              {/* TVA by rate */}
              {Object.entries(tvaByRate)
                .filter(([, v]) => Math.abs(v.tva) > 0.001)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([rate, { base, tva }]) => (
                  <View key={rate} style={s.tRow}>
                    <Text style={s.tLabel}>TVA {rate}% (bază {fmt(base)} {currency})</Text>
                    <Text style={s.tValue}>{fmt(tva)} {currency}</Text>
                  </View>
                ))}

              {/* Total TVA */}
              <View style={s.tDivider} />
              <View style={s.tRow}>
                <Text style={s.tLabelSemi}>Total TVA</Text>
                <Text style={s.tValueSemi}>{fmt(totalTVA)} {currency}</Text>
              </View>

              {/* Grand total */}
              <View style={s.tDividerStrong} />
              <View style={s.grandTotalRow}>
                <Text style={[s.grandTotalLabel, isStorno ? { color: RED } : {}]}>
                  TOTAL DE PLATĂ (cu TVA)
                </Text>
                <Text style={[s.grandTotalValue, isStorno ? { color: RED } : {}]}>
                  {fmt(totalTTC)} {currency}
                </Text>
              </View>

              {/* Aconturi */}
              {hasAcomptes && (
                <>
                  <View style={[s.tDivider, { marginTop: 6 }]} />
                  <View style={s.tRow}>
                    <Text style={s.tLabelGreen}>Aconturi deduse</Text>
                    <Text style={s.tValueGreen}>−{fmt(acomptes)} {currency}</Text>
                  </View>
                  <View style={[s.restRow, { backgroundColor: cfg.accent }]}>
                    <Text style={s.restLabel}>REST DE ACHITAT</Text>
                    <Text style={s.restValue}>{fmt(displayTotal)} {currency}</Text>
                  </View>
                </>
              )}

            </View>
          </View>

          {/* ── User mentions ── */}
          {mentiuni && (
            <View style={s.notesSection}>
              <Text style={s.notesLabel}>Mențiuni</Text>
              <Text style={s.notesText}>{mentiuni}</Text>
            </View>
          )}

          {/* ── Legal text ── */}
          <View style={s.legalSection}>
            <Text style={s.legalText}>{legal}</Text>
          </View>

          {/* ── Signatures ── */}
          <View style={s.signRow}>
            <View style={s.signBlock}>
              <Text style={s.signLabel}>Furnizor — semnătură și ștampilă</Text>
              <View style={s.signLine} />
              <Text style={s.signName}>{emitent.name}</Text>
            </View>
            <View style={s.signBlock}>
              <Text style={s.signLabel}>Beneficiar — confirmare primire</Text>
              <View style={s.signLine} />
              <Text style={s.signName}>{client.name}</Text>
            </View>
          </View>

        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Text style={s.footerText}>Document generat cu Taxly</Text>
          <Text style={s.footerText}>taxly.ro</Text>
        </View>

      </Page>
    </Document>
  )
}
