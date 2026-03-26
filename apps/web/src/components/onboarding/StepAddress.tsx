'use client'

import { useState } from 'react'
import type { OnboardingData } from '@/app/onboarding/page'

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

  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900">Adresă sediu</h2>
      <p className="mb-8 text-gray-500">
        Adresa va apărea pe facturile emise, conform cerințelor legale.
      </p>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Județ</label>
          <select
            value={county}
            onChange={e => setCounty(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-taxly-500 focus:outline-none focus:ring-2 focus:ring-taxly-500/20"
          >
            <option value="">Selectează județul</option>
            {COUNTIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Adresă completă</label>
          <textarea
            value={address}
            onChange={e => setAddress(e.target.value)}
            rows={3}
            placeholder="Str. Exemplu nr. 1, Bloc A, Ap. 2, Oraș"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-taxly-500 focus:outline-none focus:ring-2 focus:ring-taxly-500/20"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <button
          onClick={handleNext}
          className="w-full rounded-lg bg-taxly-700 py-2.5 text-sm font-semibold text-white hover:bg-taxly-800"
        >
          Continuă →
        </button>
      </div>

      <button onClick={onBack} className="mt-4 text-sm font-medium text-gray-500 hover:text-taxly-700">
        ← Înapoi
      </button>
    </div>
  )
}
