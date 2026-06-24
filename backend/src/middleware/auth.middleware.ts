import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../config/prisma.js'
import { verifyAccessToken } from '../utils/jwt.js'

export type AuthRequest = Request & {
  user?: { id: string; sessionId: string; role: string }
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const list: Record<string, string> = {}
  if (!cookieHeader) return list
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=')
    const key = parts.shift()?.trim()
    if (key) {
      list[key] = decodeURIComponent(parts.join('='))
    }
  })
  return list
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let token: string | undefined
    const header = req.header('Authorization')
    if (header?.startsWith('Bearer ')) {
      token = header.slice(7)
    } else {
      const cookies = parseCookies(req.headers.cookie)
      token = cookies['accessToken']
    }
    
    if (!token) return res.status(401).json({ code: 'AUTH_REQUIRED', message: 'Bearer token or session cookie required.' })
    const payload = verifyAccessToken(token)
    const session = await prisma.userSession.findUnique({
      where: { id: payload.sid },
      include: { user: { select: { role: true } } },
    })
    if (!session || session.revokedAt || session.expiresAt < new Date()) return res.status(401).json({ code: 'AUTH_SESSION_EXPIRED', message: 'Session expired.' })
    req.user = { id: payload.sub, sessionId: payload.sid, role: session.user.role }
    return next()
  } catch {
    return res.status(401).json({ code: 'AUTH_INVALID_TOKEN', message: 'Invalid token.' })
  }
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ code: 'AUTH_REQUIRED', message: 'Bearer token required.' })
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ code: 'ADMIN_ACCESS_REQUIRED', message: 'Admin access required.' })
    }
    return next()
  } catch (error) {
    return next(error)
  }
}

