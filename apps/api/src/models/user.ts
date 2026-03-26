import mongoose, { type Document, type Model, Schema } from 'mongoose'
import type { EntityType, FiscalRegime, SubscriptionPlan, VatStatus } from '@taxly/types'

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  email: string
  passwordHash: string
  name: string
  entityType?: EntityType
  fiscalRegime?: FiscalRegime
  cui?: string
  cnp?: string
  caenCode?: string
  vatStatus?: VatStatus
  county?: string
  address?: string
  tradeRegisterNumber?: string
  onboardingCompleted: boolean
  subscription: SubscriptionPlan
  trialEndsAt?: Date
  refreshTokenHash?: string
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    entityType: { type: String, enum: ['PFA', 'II', 'SRL'] },
    fiscalRegime: { type: String, enum: ['real', 'norma_venit'] },
    cui: { type: String, trim: true, index: true },
    cnp: { type: String, trim: true },
    caenCode: { type: String, trim: true },
    vatStatus: { type: String, enum: ['neplatitor', 'platitor', 'platitor_special'] },
    county: { type: String, trim: true },
    address: { type: String, trim: true },
    tradeRegisterNumber: { type: String, trim: true },
    onboardingCompleted: { type: Boolean, default: false },
    subscription: {
      type: String,
      enum: ['start', 'essential', 'pro', 'trial'],
      default: 'trial',
    },
    trialEndsAt: { type: Date },
    refreshTokenHash: { type: String },
  },
  { timestamps: true },
)


export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema)
