/**
 * Verificare CUI prin ANAF API public (fără autentificare)
 * Endpoint: https://webservicesp.anaf.ro/PlatitorTvaRest/api/v8/ws/tva
 */

export interface AnafCompanyData {
  cui: number
  data: string
  denumire: string
  adresa: string
  nrRegCom: string
  telefon: string
  codPostal: string
  act: string
  stare_inregistrare: string
  data_inregistrare: string
  cod_CAEN: string
  inregistrat_RTVAI: boolean
  data_inceput_TVA?: string
  data_sfarsit_TVA?: string
  mesaj?: string
}

export interface AnafVerifyResult {
  found: boolean
  data?: {
    cui: string
    name: string
    address: string
    tradeRegisterNumber: string
    caenCode: string
    vatStatus: 'neplatitor' | 'platitor'
    registrationDate?: string
  }
  error?: string
}

export async function verifyCUI(cui: string): Promise<AnafVerifyResult> {
  const cleanCui = cui.replace(/^RO/i, '').trim()
  const today = new Date().toISOString().split('T')[0]!

  try {
    const response = await fetch('https://webservicesp.anaf.ro/PlatitorTvaRest/api/v8/ws/tva', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ cui: Number(cleanCui), data: today }]),
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      return { found: false, error: `ANAF API error: ${response.status}` }
    }

    const json = (await response.json()) as { found: AnafCompanyData[]; notFound: number[] }

    if (!json.found || json.found.length === 0) {
      return { found: false, error: 'CUI-ul nu a fost găsit în baza de date ANAF' }
    }

    const company = json.found[0]!

    return {
      found: true,
      data: {
        cui: String(company.cui),
        name: company.denumire,
        address: company.adresa,
        tradeRegisterNumber: company.nrRegCom,
        caenCode: company.cod_CAEN,
        vatStatus: company.inregistrat_RTVAI ? 'platitor' : 'neplatitor',
        registrationDate: company.data_inregistrare,
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Eroare necunoscută'
    return { found: false, error: `Verificarea ANAF a eșuat: ${message}` }
  }
}
