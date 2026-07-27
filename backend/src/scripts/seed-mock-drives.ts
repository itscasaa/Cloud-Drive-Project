import { prisma } from '../config/prisma.js'
import { hashPassword } from '../utils/password.js'
import { encryptUserFields, emailLookupHash } from '../utils/pii.js'
import { encryptAccountIdentity } from '../utils/pii.js'

async function seed() {
  console.log('Seeding mock accounts and files...')

  // 1. Create or get user
  const email = 'daninniii@gmail.com'
  const passwordHash = await hashPassword('daniok12z')
  const encrypted = encryptUserFields({ name: 'Dani', email })
  const user = await prisma.user.upsert({
    where: { emailHash: encrypted.emailHash },
    create: {
      email: encrypted.email,
      name: encrypted.name,
      emailHash: encrypted.emailHash,
      passwordHash,
      role: 'admin',
    },
    update: {
      passwordHash,
      role: 'admin',
    },
  })

  // Ensure user has upload routing policy
  await prisma.uploadRoutingPolicy.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      mode: 'most_available',
      priorityAccountIds: [],
    },
    update: {},
  })

  // Clear existing mock accounts and files to start fresh
  await prisma.connectedAccount.deleteMany({
    where: {
      providerAccountId: { in: ['google-mock-1', 'google-mock-2'] },
    },
  })

  // 2. Create connected accounts
  const drive1Identity = encryptAccountIdentity({ email: 'drive1@example.com', displayName: 'Google Drive Account 1' })
  const drive1 = await prisma.connectedAccount.create({
    data: {
      userId: user.id,
      provider: 'google_drive',
      providerAccountId: 'google-mock-1',
      email: drive1Identity.email,
      emailHash: drive1Identity.emailHash,
      displayName: drive1Identity.displayName,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
      status: 'connected',
      storageAccount: {
        create: {
          totalBytes: BigInt(15 * 1024 * 1024 * 1024), // 15 GB
          usedBytes: BigInt(5 * 1024 * 1024 * 1024),   // 5 GB
          availableBytes: BigInt(10 * 1024 * 1024 * 1024),
        },
      },
    },
  })

  const drive2Identity = encryptAccountIdentity({ email: 'drive2@example.com', displayName: 'Google Drive Account 2' })
  const drive2 = await prisma.connectedAccount.create({
    data: {
      userId: user.id,
      provider: 'google_drive',
      providerAccountId: 'google-mock-2',
      email: drive2Identity.email,
      emailHash: drive2Identity.emailHash,
      displayName: drive2Identity.displayName,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
      status: 'connected',
      storageAccount: {
        create: {
          totalBytes: BigInt(15 * 1024 * 1024 * 1024), // 15 GB
          usedBytes: BigInt(2 * 1024 * 1024 * 1024),   // 2 GB
          availableBytes: BigInt(13 * 1024 * 1024 * 1024),
        },
      },
    },
  })

  // 3. Create mock files for both drives
  await prisma.file.createMany({
    data: [
      {
        userId: user.id,
        connectedAccountId: drive1.id,
        provider: 'google_drive',
        providerFileId: 'mock-file-1-d1',
        name: 'Vacation Photo.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: BigInt(3 * 1024 * 1024),
        status: 'active',
      },
      {
        userId: user.id,
        connectedAccountId: drive1.id,
        provider: 'google_drive',
        providerFileId: 'mock-file-2-d1',
        name: 'Project Roadmap.pdf',
        mimeType: 'application/pdf',
        sizeBytes: BigInt(1 * 1024 * 1024),
        status: 'active',
      },
      {
        userId: user.id,
        connectedAccountId: drive2.id,
        provider: 'google_drive',
        providerFileId: 'mock-file-1-d2',
        name: 'Presentation.pptx',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        sizeBytes: BigInt(12 * 1024 * 1024),
        status: 'active',
      },
      {
        userId: user.id,
        connectedAccountId: drive2.id,
        provider: 'google_drive',
        providerFileId: 'mock-file-2-d2',
        name: 'Demo Video.mp4',
        mimeType: 'video/mp4',
        sizeBytes: BigInt(45 * 1024 * 1024),
        status: 'active',
      },
    ],
  })

  console.log('Seeding completed successfully!')
  console.log(`User: ${email}`)
  console.log('Password: daniok12z')
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding failed:', err)
    process.exit(1)
  })
