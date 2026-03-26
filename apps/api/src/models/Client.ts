import mongoose, { type Document, type Model, Schema } from 'mongoose'

export interface IClient extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
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
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const ClientSchema = new Schema<IClient>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    cui: { type: String, trim: true },
    cnp: { type: String, trim: true },
    address: { type: String, required: true, trim: true },
    county: { type: String, trim: true },
    country: { type: String, default: 'RO' },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    bankAccount: { type: String, trim: true },
    bankName: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const Client: Model<IClient> = mongoose.model<IClient>('Client', ClientSchema)
