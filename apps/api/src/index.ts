import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'
import jwt from '@fastify/jwt'

import { connectDB } from './plugins/database.js'
import { connectRedis } from './plugins/redis.js'
import { authRoutes } from './routes/auth.js'
import { invoiceRoutes } from './routes/invoices.js'
import { clientRoutes } from './routes/clients.js'
import { fiscalRoutes } from './routes/fiscal.js'

const app = Fastify({
  logger: {
    level: process.env['LOG_LEVEL'] ?? 'info',
  },
})

// Plugins
await app.register(helmet)
await app.register(cors, {
  origin: process.env['FRONTEND_URL'] ?? 'http://localhost:3000',
  credentials: true,
})
await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
})
await app.register(sensible)
await app.register(jwt, {
  secret: process.env['JWT_SECRET'] ?? 'fallback-secret-change-in-production',
})

// Database connections
await connectDB()
await connectRedis()

// Routes
await app.register(authRoutes, { prefix: '/api/auth' })
await app.register(invoiceRoutes, { prefix: '/api/invoices' })
await app.register(clientRoutes, { prefix: '/api/clients' })
await app.register(fiscalRoutes, { prefix: '/api/fiscal' })

// Health check
app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

const port = Number(process.env['PORT'] ?? 4000)
const host = process.env['HOST'] ?? '0.0.0.0'

try {
  await app.listen({ port, host })
  app.log.info(`🚀 Taxly API running at http://${host}:${port}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
