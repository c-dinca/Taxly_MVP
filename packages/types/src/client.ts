export interface Client {
  _id: string
  userId: string
  name: string
  cui?: string
  cnp?: string
  vatCode?: string
  address: string
  county?: string
  country: string
  email?: string
  phone?: string
  bankAccount?: string
  bankName?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateClientDto {
  name: string
  cui?: string
  cnp?: string
  address: string
  county?: string
  country: string
  email?: string
  phone?: string
  bankAccount?: string
  bankName?: string
}

export interface CatalogItem {
  _id: string
  userId: string
  name: string
  description?: string
  defaultPrice: number
  defaultVatRate: number
  unit: string
  isActive: boolean
}
