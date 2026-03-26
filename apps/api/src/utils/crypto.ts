import argon2 from 'argon2'
import crypto from 'node:crypto'

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id })
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password)
}

export function generateTokenId(): string {
  return crypto.randomBytes(32).toString('hex')
}
