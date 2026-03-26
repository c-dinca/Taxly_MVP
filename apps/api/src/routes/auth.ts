import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { User } from '../models/user'
import { hashPassword, verifyPassword } from '../utils/crypto'
import { RegisterSchema, LoginSchema } from '@taxly/schemas'

const TRIAL_DAYS = 30
const ACCESS_TOKEN_TTL = '15m'
const REFRESH_TOKEN_TTL = '30d'

interface JwtPayload {
  sub: string
  email: string
  name: string
}

function signTokens(app: FastifyInstance, payload: JwtPayload) {
  const accessToken = app.jwt.sign(payload, { expiresIn: ACCESS_TOKEN_TTL })
  const refreshToken = app.jwt.sign({ sub: payload.sub }, { expiresIn: REFRESH_TOKEN_TTL })
  return { accessToken, refreshToken }
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/auth/register
  app.post('/register', async (req: FastifyRequest, reply: FastifyReply) => {
    const result = RegisterSchema.safeParse(req.body)
    if (!result.success) {
      return reply.badRequest(result.error.issues[0]?.message ?? 'Date invalide')
    }
    const { email, password, name } = result.data

    const existing = await User.findOne({ email })
    if (existing) return reply.conflict('Un cont cu acest email există deja')

    const passwordHash = await hashPassword(password)
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000)

    const user = await User.create({ email, passwordHash, name, trialEndsAt })

    const payload: JwtPayload = { sub: user._id.toString(), email: user.email, name: user.name }
    const { accessToken, refreshToken } = signTokens(app, payload)

    return reply.code(201).send({
      accessToken,
      refreshToken,
      user: { id: user._id, email: user.email, name: user.name, onboardingCompleted: false },
    })
  })

  // POST /api/auth/login
  app.post('/login', async (req: FastifyRequest, reply: FastifyReply) => {
    const result = LoginSchema.safeParse(req.body)
    if (!result.success) {
      return reply.badRequest(result.error.issues[0]?.message ?? 'Date invalide')
    }
    const { email, password } = result.data

    const user = await User.findOne({ email })
    if (!user) return reply.unauthorized('Email sau parolă incorectă')

    const valid = await verifyPassword(user.passwordHash, password)
    if (!valid) return reply.unauthorized('Email sau parolă incorectă')

    const payload: JwtPayload = { sub: user._id.toString(), email: user.email, name: user.name }
    const { accessToken, refreshToken } = signTokens(app, payload)

    return reply.send({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        onboardingCompleted: user.onboardingCompleted,
        subscription: user.subscription,
      },
    })
  })

  // POST /api/auth/refresh
  app.post('/refresh', async (req: FastifyRequest, reply: FastifyReply) => {
    const { refreshToken } = req.body as { refreshToken?: string }
    if (!refreshToken) return reply.badRequest('refreshToken lipsă')

    let decoded: { sub: string }
    try {
      decoded = app.jwt.verify<{ sub: string }>(refreshToken)
    } catch {
      return reply.unauthorized('Refresh token invalid sau expirat')
    }

    const user = await User.findById(decoded.sub)
    if (!user) return reply.unauthorized('Utilizator negăsit')

    const payload: JwtPayload = { sub: user._id.toString(), email: user.email, name: user.name }
    const { accessToken, refreshToken: newRefreshToken } = signTokens(app, payload)

    return reply.send({ accessToken, refreshToken: newRefreshToken })
  })

  // GET /api/auth/me
  app.get(
    '/me',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { sub } = req.user as JwtPayload
      const user = await User.findById(sub).select('-passwordHash -refreshTokenHash')
      if (!user) return reply.notFound('Utilizator negăsit')
      return reply.send({ user })
    },
  )

  // PATCH /api/auth/onboarding — salvează datele wizard
  app.patch(
    '/onboarding',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { sub } = req.user as JwtPayload

      const OnboardingSchema = z.object({
        entityType: z.enum(['PFA', 'II', 'SRL']),
        fiscalRegime: z.enum(['real', 'norma_venit']),
        cui: z.string().min(2).max(12),
        cnp: z.string().length(13).optional(),
        caenCode: z.string().length(4),
        vatStatus: z.enum(['neplatitor', 'platitor', 'platitor_special']),
        county: z.string().min(2),
        address: z.string().min(5),
        tradeRegisterNumber: z.string().optional(),
        complete: z.boolean().optional(),
      })

      const result = OnboardingSchema.safeParse(req.body)
      if (!result.success) {
        return reply.badRequest(result.error.issues[0]?.message ?? 'Date invalide')
      }

      const { complete, ...fields } = result.data
      const user = await User.findByIdAndUpdate(
        sub,
        { ...fields, ...(complete ? { onboardingCompleted: true } : {}) },
        { new: true },
      ).select('-passwordHash -refreshTokenHash')

      return reply.send({ user })
    },
  )
}
