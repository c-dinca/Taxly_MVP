import type { NextConfig } from 'next'
import path from 'path'
import withSerwistInit from '@serwist/next'

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

export default withSerwist(nextConfig)
