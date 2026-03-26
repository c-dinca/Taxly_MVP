import mongoose, { type Document, type Model, Schema } from 'mongoose'

export interface IInvoiceLine {
  description: string
  quantity: number
  unitPrice: number
  vatRate: number
  unit: string
  total: number
  vatAmount: number
}

export interface IInvoice extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  number: number
  series: string
  fullNumber: string
  type: 'factura' | 'deviz' | 'proforma' | 'avans' | 'storno'
  status: 'draft' | 'emisa' | 'trimisa_anaf' | 'validata_anaf' | 'respinsa_anaf' | 'incasata' | 'anulata'
  issueDate: Date
  dueDate?: Date
  client: {
    _id: mongoose.Types.ObjectId
    name: string
    cui?: string
    address: string
    email?: string
    county?: string
    country: string
  }
  lines: IInvoiceLine[]
  subtotal: number
  vatTotal: number
  total: number
  currency: 'RON' | 'EUR' | 'USD'
  exchangeRate?: number
  totalRON: number
  notes?: string
  pdfPath?: string
  createdAt: Date
  updatedAt: Date
}

const InvoiceLineSchema = new Schema<IInvoiceLine>(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    vatRate: { type: Number, required: true },
    unit: { type: String, default: 'buc' },
    total: { type: Number, required: true },
    vatAmount: { type: Number, required: true },
  },
  { _id: false },
)

const InvoiceSchema = new Schema<IInvoice>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    number: { type: Number, required: true },
    series: { type: String, required: true, default: 'TAXLY' },
    fullNumber: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ['factura', 'deviz', 'proforma', 'avans', 'storno'],
      default: 'factura',
    },
    status: {
      type: String,
      enum: ['draft', 'emisa', 'trimisa_anaf', 'validata_anaf', 'respinsa_anaf', 'incasata', 'anulata'],
      default: 'draft',
    },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date },
    client: {
      _id: { type: Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
      cui: String,
      address: { type: String, required: true },
      email: String,
      county: String,
      country: { type: String, default: 'RO' },
    },
    lines: [InvoiceLineSchema],
    subtotal: { type: Number, required: true },
    vatTotal: { type: Number, required: true },
    total: { type: Number, required: true },
    currency: { type: String, enum: ['RON', 'EUR', 'USD'], default: 'RON' },
    exchangeRate: Number,
    totalRON: { type: Number, required: true },
    notes: String,
    pdfPath: String,
  },
  { timestamps: true },
)

InvoiceSchema.index({ userId: 1, number: 1 }, { unique: true })

export const Invoice: Model<IInvoice> = mongoose.model<IInvoice>('Invoice', InvoiceSchema)
