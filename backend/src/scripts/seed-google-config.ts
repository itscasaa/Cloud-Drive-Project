import { prisma } from '../config/prisma.js'
import { encryptText } from '../utils/crypto.js'

const scopes = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
]

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim()
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim() ?? 'http://localhost:4000/connected-accounts/google/callback'

  if (!clientId || !clientSecret) throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required.')

  const existingConfig = await prisma.providerConfig.findFirst({
    where: { userId: null, provider: 'google_drive' },
    orderBy: { createdAt: 'desc' },
  })

  let config
  if (existingConfig) {
    config = await prisma.providerConfig.update({
      where: { id: existingConfig.id },
      data: {
        clientIdEncrypted: encryptText(clientId),
        clientSecretEncrypted: encryptText(clientSecret),
        redirectUri,
        scopes,
        status: 'active',
      },
    })
    console.log(`Updated existing Google Drive config: ${config.id}`)
  } else {
    config = await prisma.providerConfig.create({
      data: {
        userId: null,
        provider: 'google_drive',
        clientIdEncrypted: encryptText(clientId),
        clientSecretEncrypted: encryptText(clientSecret),
        redirectUri,
        scopes,
        status: 'active',
      },
    })
    console.log(`Seeded global Google Drive config: ${config.id}`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
