'use client'

import { useState } from 'react'
import type { Client, CreateClientDto } from '@taxly/types'
import { Button } from '@/components/ui/Button'
import { apiRequest } from '@/lib/api'
import { useAuthToken } from '@/hooks/useAuthToken'

interface ClientModalProps {
  open: boolean
  onClose: () => void
  onSaved: (client: Client) => void
  editClient?: Client | null
}

const EMPTY: CreateClientDto = {
  name: '',
  cui: '',
  address: '',
  county: '',
  country: 'România',
  email: '',
  phone: '',
  bankAccount: '',
  bankName: '',
}

export function ClientModal({ open, onClose, onSaved, editClient }: ClientModalProps) {
  const token = useAuthToken()
  const [form, setForm] = useState<CreateClientDto>(
    editClient
      ? {
          name: editClient.name,
          cui: editClient.cui ?? '',
          address: editClient.address,
          county: editClient.county ?? '',
          country: editClient.country,
          email: editClient.email ?? '',
          phone: editClient.phone ?? '',
          bankAccount: editClient.bankAccount ?? '',
          bankName: editClient.bankName ?? '',
        }
      : EMPTY,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  function set(field: keyof CreateClientDto, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setError(null)
    setLoading(true)
    try {
      const body: CreateClientDto = {
        ...form,
        cui: form.cui || undefined,
        county: form.county || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        bankAccount: form.bankAccount || undefined,
        bankName: form.bankName || undefined,
      }
      const res = editClient
        ? await apiRequest<{ client: Client }>(`/api/clients/${editClient._id}`, {
            method: 'PUT',
            body: JSON.stringify(body),
            token,
          })
        : await apiRequest<{ client: Client }>('/api/clients', {
            method: 'POST',
            body: JSON.stringify(body),
            token,
          })
      onSaved(res.client)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare necunoscută')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl border border-[#E2EAF4] shadow-lg w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2EAF4]">
          <h2 className="text-base font-bold text-[#0D1B3E]">
            {editClient ? 'Editează client' : 'Client nou'}
          </h2>
          <button onClick={onClose} className="text-[#5A6A8A] hover:text-[#0D1B3E] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-[#5A6A8A] mb-1">Nume *</label>
              <input
                required
                value={form.name}
                onChange={e => set('name', e.target.value)}
                className="w-full rounded-lg border border-[#E2EAF4] px-3 py-2 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700"
                placeholder="Nume companie / persoană"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5A6A8A] mb-1">CUI / CNP</label>
              <input
                value={form.cui}
                onChange={e => set('cui', e.target.value)}
                className="w-full rounded-lg border border-[#E2EAF4] px-3 py-2 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700"
                placeholder="RO12345678"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5A6A8A] mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                className="w-full rounded-lg border border-[#E2EAF4] px-3 py-2 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700"
                placeholder="contact@firma.ro"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-[#5A6A8A] mb-1">Adresă *</label>
              <input
                required
                value={form.address}
                onChange={e => set('address', e.target.value)}
                className="w-full rounded-lg border border-[#E2EAF4] px-3 py-2 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700"
                placeholder="Str. Exemplu, nr. 1, București"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5A6A8A] mb-1">Județ</label>
              <input
                value={form.county}
                onChange={e => set('county', e.target.value)}
                className="w-full rounded-lg border border-[#E2EAF4] px-3 py-2 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700"
                placeholder="Cluj"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5A6A8A] mb-1">Telefon</label>
              <input
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                className="w-full rounded-lg border border-[#E2EAF4] px-3 py-2 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700"
                placeholder="+40 700 000 000"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5A6A8A] mb-1">Bancă</label>
              <input
                value={form.bankName}
                onChange={e => set('bankName', e.target.value)}
                className="w-full rounded-lg border border-[#E2EAF4] px-3 py-2 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700"
                placeholder="Banca Transilvania"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5A6A8A] mb-1">IBAN</label>
              <input
                value={form.bankAccount}
                onChange={e => set('bankAccount', e.target.value)}
                className="w-full rounded-lg border border-[#E2EAF4] px-3 py-2 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700"
                placeholder="RO49AAAA1B31007593840000"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={onClose} type="button">
              Anulează
            </Button>
            <Button type="submit" loading={loading}>
              {editClient ? 'Salvează' : 'Adaugă client'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
