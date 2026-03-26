'use client'

import { useState } from 'react'
import type { OnboardingData } from '@/app/onboarding/page'
import { Button } from '@/components/ui/Button'

interface Props {
  data: OnboardingData
  onNext: (update: Partial<OnboardingData>) => void
  onBack: () => void
}

const COUNTIES = [
  'Alba','Arad','Argeș','Bacău','Bihor','Bistrița-Năsăud','Botoșani','Brașov',
  'Brăila','Buzău','Caraș-Severin','Călărași','Cluj','Constanța','Covasna',
  'Dâmbovița','Dolj','Galați','Giurgiu','Gorj','Harghita','Hunedoara','Ialomița',
  'Iași','Ilfov','Maramureș','Mehedinți','Mureș','Neamț','Olt','Prahova',
  'Satu Mare','Sălaj','Sibiu','Suceava','Teleorman','Timiș','Tulcea','Vaslui',
  'Vâlcea','Vrancea','București',
]

export default function StepAddress({ data, onNext, onBack }: Props) {
  const [county, setCounty] = useState(data.county ?? '')
  const [address, setAddress] = useState(data.address ?? '')
  const [error, setError] = useState('')

  function handleNext() {
    if (!county) { setError('Selectează județul'); return }
    if (address.length < 5) { setError('Adresa trebuie să aibă minim 5 caractere'); return }
    onNext({ county, address })
  }

  const inputCls = "w-full rounded-lg border border-[#E2EAF4] bg-white px-3 py-2.5 text-sm text-[#0D1B3E] placeholder:text-[#8FA3C0] focus:border-taxly-700 focus:outline-none focus:ring-2 focus:ring-taxly-700/15"

  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-[#0D1B3E]">Adresă sediu</h2>
      <p className="mb-8 text-[#5A6A8A]">
        Adresa va apărea pe facturile emise, conform cerințelor legale.
      </p>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#0D1B3E]">Județ</label>
          <select
            value={county}
            onChange={e => setCounty(e.target.value)}
            className={inputCls}
          >
            <option value="">Selectează județul</option>
            {COUNTIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#0D1B3E]">Adresă completă</label>
          <textarea
            value={address}
            onChange={e => setAddress(e.target.value)}
            rows={3}
            placeholder="Str. Exemplu nr. 1, Bloc A, Ap. 2, Oraș"
            className={inputCls}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#FF5252]">{error}</div>
        )}

        <Button onClick={handleNext} className="w-full py-3">
          Continuă
        </Button>
      </div>

      <Button variant="ghost" onClick={onBack} className="w-full py-2 mt-4">
        Înapoi
      </Button>
    </div>
  )
}
