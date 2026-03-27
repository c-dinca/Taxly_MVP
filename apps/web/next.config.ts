import type { NextConfig } from 'next'
import path from 'path'
import withSerwistInit from '@serwist/next'
import { withSentryConfig } from '@sentry/nextjs'

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
  serverExternalPackages: ['@react-pdf/renderer'],
}

const sentryOptions = {
  org: process.env.SENTRY_ORG ?? 'taxly',
  project: process.env.SENTRY_PROJECT ?? 'taxly-web',
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  // Don't fail build if Sentry DSN is not set
  errorHandler: (err: Error) => { console.warn('[Sentry] Build warning:', err.message) },
}

export default withSentryConfig(withSerwist(nextConfig), sentryOptions)
