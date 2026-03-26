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

export interface IInvoiceAcompte {
  description: string
  date: Date
  amount: number
}

export interface IInvoicePayment {
  date: Date
  method: string
  notes?: string
  amountPaid: number
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
  remiseGenerala: number
  acomptes: IInvoiceAcompte[]
  acomptesTotal: number
  subtotal: number
  vatTotal: number
  total: number
  currency: 'RON' | 'EUR' | 'USD'
  exchangeRate?: number
  totalRON: number
  notes?: string
  internalNote?: string
  originalInvoiceId?: mongoose.Types.ObjectId
  originalInvoiceNumber?: string
  stornoType?: 'total' | 'partial'
  payment?: IInvoicePayment
  pdfPath?: string
  createdAt: Date
  updatedAt: Date
  totals?: {
    subtotal: number
    vatTotal: number
    total: number
    currency: string
    exchangeRate?: number
    totalRON: number
  }
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

const AcompteSchema = new Schema<IInvoiceAcompte>(
  {
    description: { type: String, default: '' },
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
  },
  { _id: true },
)

const PaymentSchema = new Schema<IInvoicePayment>(
  {
    date: { type: Date, required: true },
    method: { type: String, required: true },
    notes: String,
    amountPaid: { type: Number, required: true },
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
    remiseGenerala: { type: Number, default: 0 },
    acomptes: { type: [AcompteSchema], default: [] },
    acomptesTotal: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    vatTotal: { type: Number, required: true },
    total: { type: Number, required: true },
    currency: { type: String, enum: ['RON', 'EUR', 'USD'], default: 'RON' },
    exchangeRate: Number,
    totalRON: { type: Number, required: true },
    notes: String,
    internalNote: String,
    originalInvoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    originalInvoiceNumber: String,
    stornoType: { type: String, enum: ['total', 'partial'] },
    payment: PaymentSchema,
    pdfPath: String,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
)

InvoiceSchema.virtual('totals').get(function (this: IInvoice) {
  return {
    subtotal: this.subtotal,
    vatTotal: this.vatTotal,
    total: this.total,
    currency: this.currency,
    exchangeRate: this.exchangeRate,
    totalRON: this.totalRON,
  }
})

InvoiceSchema.index({ userId: 1, number: 1 }, { unique: true })

export const Invoice: Model<IInvoice> = mongoose.model<IInvoice>('Invoice', InvoiceSchema)
