import { app } from './app.js'
import { env } from './config/env.js'
import { cleanupExpiredRecoveryMetadata } from './scripts/cleanup-recovery.js'

app.listen(env.APP_PORT, () => {
  console.log(`Backend running on http://localhost:${env.APP_PORT}`)
  
  // Run cleanup job immediately and then once every hour
  cleanupExpiredRecoveryMetadata().catch((err) => console.error('[Startup Cleanup Error]:', err))
  setInterval(() => {
    cleanupExpiredRecoveryMetadata().catch((err) => console.error('[Cleanup Interval Error]:', err))
  }, 60 * 60 * 1000) // 1 hour
})
