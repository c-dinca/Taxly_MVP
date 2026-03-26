import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'
import jwt from '@fastify/jwt'

import { connectDB } from './plugins/database'
import { connectRedis } from './plugins/redis'
import { registerAuthDecorator } from './plugins/auth'
import { authRoutes } from './routes/auth'
import { invoiceRoutes } from './routes/invoices'
import { clientRoutes } from './routes/clients'
import { catalogRoutes } from './routes/catalog'
import { fiscalRoutes } from './routes/fiscal'
import { utilRoutes } from './routes/utils'

async function main() {
  const app = Fastify({
    logger: { level: process.env['LOG_LEVEL'] ?? 'info' },
  })

  await app.register(helmet)
  await app.register(cors, {
    origin: process.env['FRONTEND_URL'] ?? 'http://localhost:3000',
    credentials: true,
  })
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })
  await app.register(sensible)
  await app.register(jwt, {
    secret: process.env['JWT_SECRET'] ?? 'fallback-secret-change-in-production',
  })

  await connectDB()
  await connectRedis()
  registerAuthDecorator(app)

  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(invoiceRoutes, { prefix: '/api/invoices' })
  await app.register(clientRoutes, { prefix: '/api/clients' })
  await app.register(catalogRoutes, { prefix: '/api/catalog' })
  await app.register(fiscalRoutes, { prefix: '/api/fiscal' })
  await app.register(utilRoutes, { prefix: '/api/utils' })

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  const port = Number(process.env['PORT'] ?? 4000)
  const host = process.env['HOST'] ?? '0.0.0.0'

  await app.listen({ port, host })
  app.log.info(`🚀 Taxly API running at http://${host}:${port}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
