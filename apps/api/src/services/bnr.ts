import { getRedis } from '../plugins/redis'

export interface BNRRates {
  EUR: number
  USD: number
  updatedAt: string
}

export async function fetchBNRRates(): Promise<BNRRates> {
  const res = await fetch('https://www.bnr.ro/nbrfxrates.xml', {
    signal: AbortSignal.timeout(10000),
  })
  const xml = await res.text()

  const getRate = (currency: string): number => {
    const match = xml.match(new RegExp(`<Rate currency="${currency}"[^>]*>([\\d.]+)<\\/Rate>`))
    return match ? parseFloat(match[1]!) : 0
  }

  return {
    EUR: getRate('EUR'),
    USD: getRate('USD'),
    updatedAt: new Date().toISOString(),
  }
}

export async function getCachedRates(): Promise<BNRRates> {
  const redis = getRedis()
  const cached = await redis.get('bnr:rates')
  if (cached) return JSON.parse(cached) as BNRRates

  const rates = await fetchBNRRates()
  await redis.setex('bnr:rates', 86400, JSON.stringify(rates))
  return rates
}
