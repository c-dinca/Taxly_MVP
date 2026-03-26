'use client'

import { useEffect, useState } from 'react'
import type { Client } from '@taxly/types'
import { Button } from '@/components/ui/Button'
import { apiRequest } from '@/lib/api'
import { ClientModal } from './ClientModal'

interface ClientListProps {
  token: string
}

export function ClientList({ token }: ClientListProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [deactivating, setDeactivating] = useState<string | null>(null)

  useEffect(() => {
    loadClients()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadClients() {
    setLoading(true)
    setError(null)
    try {
      const data = await apiRequest<Client[]>('/api/clients', { token })
      setClients(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la încărcarea clienților')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeactivate(client: Client) {
    setDeactivating(client._id)
    try {
      await apiRequest<Client>(`/api/clients/${client._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: false }),
        token,
      })
      setClients(prev => prev.map(c => c._id === client._id ? { ...c, isActive: false } : c))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Eroare la dezactivare')
    } finally {
      setDeactivating(null)
    }
  }

  function handleSaved(saved: Client) {
    setClients(prev => {
      const idx = prev.findIndex(c => c._id === saved._id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [saved, ...prev]
    })
    setModalOpen(false)
    setEditClient(null)
  }

  function openAdd() {
    setEditClient(null)
    setModalOpen(true)
  }

  function openEdit(client: Client) {
    setEditClient(client)
    setModalOpen(true)
  }

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      (c.cui ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.county ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <>
      <ClientModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditClient(null) }}
        onSaved={handleSaved}
        token={token}
        editClient={editClient}
      />

      <div className="bg-white rounded-xl border border-[#E2EAF4] shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8FA3C0]" width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" stroke="currentColor"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Caută client..."
              className="pl-9 pr-4 py-2 rounded-lg border border-[#E2EAF4] text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700 w-64"
            />
          </div>
          <Button onClick={openAdd} className="px-4 py-2">
            + Client nou
          </Button>
        </div>

        {loading && (
          <div className="text-center py-12 text-sm text-[#5A6A8A]">Se încarcă...</div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2EAF4]">
                  <th className="pb-3 text-left font-medium text-[#5A6A8A] pr-4">Nume</th>
                  <th className="pb-3 text-left font-medium text-[#5A6A8A] pr-4">CUI</th>
                  <th className="pb-3 text-left font-medium text-[#5A6A8A] pr-4">Email</th>
                  <th className="pb-3 text-left font-medium text-[#5A6A8A] pr-4">Județ</th>
                  <th className="pb-3 text-left font-medium text-[#5A6A8A]">Status</th>
                  <th className="pb-3 text-right font-medium text-[#5A6A8A]">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[#8FA3C0]">
                      {search ? 'Niciun client găsit' : 'Nu ai adăugat clienți încă'}
                    </td>
                  </tr>
                )}
                {filtered.map(client => (
                  <tr key={client._id} className="border-b border-[#F4F6FB] hover:bg-[#F4F6FB]/60 transition-colors">
                    <td className="py-3 pr-4 font-medium text-[#0D1B3E]">{client.name}</td>
                    <td className="py-3 pr-4 text-[#5A6A8A]">{client.cui ?? '—'}</td>
                    <td className="py-3 pr-4 text-[#5A6A8A]">{client.email ?? '—'}</td>
                    <td className="py-3 pr-4 text-[#5A6A8A]">{client.county ?? '—'}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        client.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {client.isActive ? 'Activ' : 'Inactiv'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => openEdit(client)}
                          className="px-3 py-1 text-xs"
                        >
                          Editează
                        </Button>
                        {client.isActive && (
                          <Button
                            variant="ghost"
                            loading={deactivating === client._id}
                            onClick={() => handleDeactivate(client)}
                            className="px-3 py-1 text-xs text-red-500 hover:text-red-700"
                          >
                            Dezactivează
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
