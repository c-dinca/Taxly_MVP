import mongoose, { type Document, type Model, Schema } from 'mongoose'

export interface ICatalogItem extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  name: string
  description?: string
  defaultPrice: number
  defaultVatRate: number
  unit: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const CatalogItemSchema = new Schema<ICatalogItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    defaultPrice: { type: Number, required: true, min: 0 },
    defaultVatRate: { type: Number, required: true, min: 0, max: 100, default: 19 },
    unit: { type: String, default: 'buc', trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const CatalogItem: Model<ICatalogItem> = mongoose.model<ICatalogItem>('CatalogItem', CatalogItemSchema)
