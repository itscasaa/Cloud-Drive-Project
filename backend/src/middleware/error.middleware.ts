import type { NextFunction, Request, Response } from 'express'

export function errorMiddleware(error: any, _req: Request, res: Response, _next: NextFunction) {
  // Log the actual error on the server for debugging purposes
  console.error('[Unhandled Error]', error)

  const statusCode = error?.statusCode || error?.status || 500
  let code = error?.code || 'INTERNAL_SERVER_ERROR'
  let message = 'An unexpected error occurred. Please try again.'

  if (statusCode < 500) {
    const rawMessage = error instanceof Error ? error.message : String(error)
    if (
      rawMessage.includes('PrismaClient') ||
      rawMessage.includes('prisma') ||
      rawMessage.includes('google') ||
      rawMessage.includes('Google') ||
      rawMessage.includes('at ') ||
      rawMessage.includes('Stack') ||
      rawMessage.includes('stack')
    ) {
      message = 'A system error occurred. Access denied or config mismatch.'
    } else {
      message = rawMessage
    }
  } else {
    // Check if error is database related (Prisma)
    const isPrismaError = error?.constructor?.name?.startsWith('Prisma') || 
                          (error?.message && error.message.includes('prisma'))
    const isGoogleError = error?.message && (error.message.includes('google') || error.message.includes('Google'))
    
    if (isPrismaError) {
      code = 'DATABASE_ERROR'
      message = 'A database error occurred. Please try again later.'
    } else if (isGoogleError) {
      code = 'GOOGLE_API_ERROR'
      message = 'A connection error occurred with the storage provider. Please check settings.'
    } else {
      code = 'INTERNAL_SERVER_ERROR'
      message = 'An internal server error occurred.'
    }
  }

  return res.status(statusCode).json({ code, message })
}
