export type EntityType = 'PFA' | 'II' | 'SRL'
export type FiscalRegime = 'real' | 'norma_venit'
export type VatStatus = 'neplatitor' | 'platitor' | 'platitor_special'

export interface User {
  _id: string
  email: string
  name: string
  entityType: EntityType
  fiscalRegime: FiscalRegime
  cui: string
  cnp?: string
  caenCode: string
  vatStatus: VatStatus
  county: string
  address: string
  tradeRegisterNumber?: string
  onboardingCompleted: boolean
  subscription: SubscriptionPlan
  createdAt: string
  updatedAt: string
}

export type SubscriptionPlan = 'start' | 'essential' | 'pro' | 'trial'

export interface UserProfile {
  name: string
  email: string
  entityType: EntityType
  fiscalRegime: FiscalRegime
  cui: string
  cnp?: string
  caenCode: string
  vatStatus: VatStatus
  county: string
  address: string
  tradeRegisterNumber?: string
}
