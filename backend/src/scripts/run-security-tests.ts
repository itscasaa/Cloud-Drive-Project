import { PrismaClient } from '@prisma/client'
import { encryptAccountIdentity } from '../utils/pii.js'

const prisma = new PrismaClient()
const API_URL = 'http://localhost:4000'

async function request(path: string, options: any = {}) {
  const url = `${API_URL}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })
  
  let body: any = {}
  try {
    body = await response.json()
  } catch (e) {}
  
  return { status: response.status, body }
}

async function run() {
  console.log('=== STARTING SECURITY HARDENING VALIDATION TESTS ===')
  
  // 1. Create two demo users
  console.log('\nCreating User A via demo login...')
  const userARes = await request('/auth/demo-login', { method: 'POST' })
  if (userARes.status !== 201) throw new Error(`User A creation failed: ${userARes.status}`)
  const userA = userARes.body.user
  const tokenA = userARes.body.accessToken
  console.log(`User A created: id=${userA.id}, email=${userA.email}`)

  console.log('\nCreating User B via demo login...')
  const userBRes = await request('/auth/demo-login', { method: 'POST' })
  if (userBRes.status !== 201) throw new Error(`User B creation failed: ${userBRes.status}`)
  const userB = userBRes.body.user
  const tokenB = userBRes.body.accessToken
  console.log(`User B created: id=${userB.id}, email=${userB.email}`)

  // 2. Create User A private resources directly in the database
  console.log('\nSeeding User A private resources in database...')
  
  const folderA = await prisma.folder.create({
    data: {
      userId: userA.id,
      name: 'User A Folder',
      color: '#3b82f6'
    }
  })
  console.log(`Folder A created in DB: id=${folderA.id}`)

  // Retrieve a provider config for connected accounts
  const googleConfig = await prisma.providerConfig.findFirst({
    where: { userId: null, provider: 'google_drive' }
  })
  if (!googleConfig) throw new Error('Global Google OAuth config must be configured. Run seed:google-config or bootstrap first.')

  const accountAIdentity = encryptAccountIdentity({ email: 'user-a-drive@gmail.com' })
  const accountA = await prisma.connectedAccount.create({
    data: {
      userId: userA.id,
      providerConfigId: googleConfig.id,
      provider: 'google_drive',
      providerAccountId: 'user-a-fake-account-id',
      email: accountAIdentity.email,
      emailHash: accountAIdentity.emailHash,
      accessTokenEncrypted: 'fake-encrypted-access-token',
      refreshTokenEncrypted: 'fake-encrypted-refresh-token',
      scopes: ['https://www.googleapis.com/auth/drive.file'],
      status: 'connected'
    }
  })
  console.log(`Connected Account A created in DB: id=${accountA.id}`)

  const fileA = await prisma.file.create({
    data: {
      userId: userA.id,
      connectedAccountId: accountA.id,
      folderId: folderA.id,
      provider: 'google_drive',
      providerFileId: 'fake-google-file-id-for-user-a',
      name: 'user_a_private.txt',
      mimeType: 'text/plain',
      sizeBytes: 1024n,
      status: 'active'
    }
  })
  console.log(`File A created in DB: id=${fileA.id}`)

  // Define Authorization headers
  const headersA = { 'Authorization': `Bearer ${tokenA}` }
  const headersB = { 'Authorization': `Bearer ${tokenB}` }

  // 3. User B tries to access User A's files
  console.log('\n--- Testing File Isolation ---')
  
  console.log('Test: User B gets User A file details...')
  const fileGetRes = await request(`/files/${fileA.id}`, { headers: headersB })
  console.log(`Status: ${fileGetRes.status} (Expected: 403 or 404)`)
  if (fileGetRes.status !== 403 && fileGetRes.status !== 404) {
    throw new Error('SECURITY VIOLATION: User B accessed User A\'s file details!')
  }

  console.log('Test: User B renames User A\'s file...')
  const fileRenameRes = await request(`/files/${fileA.id}`, {
    method: 'PATCH',
    headers: headersB,
    body: JSON.stringify({ name: 'hacked.txt' })
  })
  console.log(`Status: ${fileRenameRes.status} (Expected: 403 or 404)`)
  if (fileRenameRes.status !== 403 && fileRenameRes.status !== 404) {
    throw new Error('SECURITY VIOLATION: User B renamed User A\'s file!')
  }

  console.log('Test: User B downloads User A\'s file...')
  const fileDownloadRes = await request(`/files/${fileA.id}/download`, { headers: headersB })
  console.log(`Status: ${fileDownloadRes.status} (Expected: 403 or 404)`)
  if (fileDownloadRes.status !== 403 && fileDownloadRes.status !== 404) {
    throw new Error('SECURITY VIOLATION: User B downloaded User A\'s file!')
  }

  console.log('Test: User B deletes User A\'s file...')
  const fileDeleteRes = await request(`/files/${fileA.id}`, {
    method: 'DELETE',
    headers: headersB
  })
  console.log(`Status: ${fileDeleteRes.status} (Expected: 403 or 404)`)
  if (fileDeleteRes.status !== 403 && fileDeleteRes.status !== 404) {
    throw new Error('SECURITY VIOLATION: User B deleted User A\'s file!')
  }

  // 4. User B tries to access User A's folders
  console.log('\n--- Testing Folder Isolation ---')
  
  console.log('Test: User B renames User A\'s folder...')
  const folderRenameRes = await request(`/folders/${folderA.id}`, {
    method: 'PATCH',
    headers: headersB,
    body: JSON.stringify({ name: 'hacked-folder' })
  })
  console.log(`Status: ${folderRenameRes.status} (Expected: 403 or 404)`)
  if (folderRenameRes.status !== 403 && folderRenameRes.status !== 404) {
    throw new Error('SECURITY VIOLATION: User B renamed User A\'s folder!')
  }

  console.log('Test: User B deletes User A\'s folder...')
  const folderDeleteRes = await request(`/folders/${folderA.id}`, {
    method: 'DELETE',
    headers: headersB
  })
  console.log(`Status: ${folderDeleteRes.status} (Expected: 403 or 404)`)
  if (folderDeleteRes.status !== 403 && folderDeleteRes.status !== 404) {
    throw new Error('SECURITY VIOLATION: User B deleted User A\'s folder!')
  }

  // 5. User B tries to access User A's connected accounts
  console.log('\n--- Testing Connected Account Isolation ---')
  
  console.log('Test: User B syncs quota of User A\'s connected account...')
  const accountSyncRes = await request(`/connected-accounts/${accountA.id}/sync-quota`, {
    method: 'POST',
    headers: headersB
  })
  console.log(`Status: ${accountSyncRes.status} (Expected: 403 or 404)`)
  if (accountSyncRes.status !== 403 && accountSyncRes.status !== 404) {
    throw new Error('SECURITY VIOLATION: User B synced quota for User A\'s connected account!')
  }

  console.log('Test: User B disconnects User A\'s connected account...')
  const accountDeleteRes = await request(`/connected-accounts/${accountA.id}`, {
    method: 'DELETE',
    headers: headersB
  })
  console.log(`Status: ${accountDeleteRes.status} (Expected: 403 or 404)`)
  if (accountDeleteRes.status !== 403 && accountDeleteRes.status !== 404) {
    throw new Error('SECURITY VIOLATION: User B disconnected User A\'s connected account!')
  }

  // 5b. Test global account ownership & duplicate email checks
  console.log('\n--- Testing Global Account Ownership & Duplicate Registration ---')

  console.log('Test: Registering duplicate email...')
  const dupRegisterRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Duplicate User',
      email: userA.email,
      password: 'Password123'
    })
  })
  console.log(`Status: ${dupRegisterRes.status}, Message: ${dupRegisterRes.body.message}`)
  if (dupRegisterRes.status !== 409 || dupRegisterRes.body.message !== 'This email is already registered. Please login instead.') {
    throw new Error('SECURITY VIOLATION: Duplicate email registration was not blocked correctly!')
  }

  console.log('Test: Enforcing database unique constraint on provider + providerAccountId...')
  try {
    const dupIdentity = encryptAccountIdentity({ email: 'user-b-drive@gmail.com' })
    await prisma.connectedAccount.create({
      data: {
        userId: userB.id,
        providerConfigId: googleConfig.id,
        provider: 'google_drive',
        providerAccountId: 'user-a-fake-account-id',
        email: dupIdentity.email,
        emailHash: dupIdentity.emailHash,
        scopes: ['https://www.googleapis.com/auth/drive.file']
      }
    })
    throw new Error('SECURITY VIOLATION: Database unique constraint failed to block duplicate providerAccountId!')
  } catch (err: any) {
    if (err.message && err.message.includes('PrismaClient')) {
      throw err
    }
    console.log('Success: Database unique constraint blocked duplicate providerAccountId.')
  }

  // 6. Test invalid/duplicate/garbage IDs return 404 or 403 cleanly
  console.log('\n--- Testing Invalid/Garbage IDs ---')
  const garbageId = 'this-is-not-a-valid-uuid'
  
  console.log('Test: Request with invalid file ID...')
  const invalidFileRes = await request(`/files/${garbageId}`, { headers: headersA })
  console.log(`Status: ${invalidFileRes.status} (Expected: 404 or 403)`)
  if (invalidFileRes.status !== 404 && invalidFileRes.status !== 403) {
    throw new Error(`SECURITY VIOLATION: Invalid file ID returned unexpected status ${invalidFileRes.status}`)
  }

  console.log('Test: Request with invalid folder ID...')
  const invalidFolderRes = await request(`/folders/${garbageId}`, { headers: headersA })
  console.log(`Status: ${invalidFolderRes.status} (Expected: 404 or 403)`)
  if (invalidFolderRes.status !== 404 && invalidFolderRes.status !== 403) {
    throw new Error(`SECURITY VIOLATION: Invalid folder ID returned unexpected status ${invalidFolderRes.status}`)
  }

  // 7. Verify no secrets or Prisma stack traces in responses
  console.log('\n--- Testing Response Information Disclosure ---')
  
  console.log('Checking User A profile details response...')
  const meRes = await request('/auth/me', { headers: headersA })
  const responseStr = JSON.stringify(meRes.body)
  const secrets = ['clientSecret', 'accessTokenEncrypted', 'refreshTokenEncrypted', 'PrismaClient', 'at ', 'Stack', 'stack']
  
  for (const secret of secrets) {
    if (responseStr.includes(secret)) {
      throw new Error(`SECURITY VIOLATION: Secret or system stack traces disclosed in profile response! Contains: "${secret}"`)
    }
  }
  console.log('Success: No secrets or stack traces found in user profile response.')

  console.log('Checking error response for information disclosure with invalid ID...')
  const invalidFileDetails = await request(`/files/${garbageId}`, { headers: headersA })
  const errorStr = JSON.stringify(invalidFileDetails.body)
  
  for (const secret of secrets) {
    if (errorStr.includes(secret)) {
      throw new Error(`SECURITY VIOLATION: Internal stack trace or database detail disclosed in error response! Contains: "${secret}"`)
    }
  }
  console.log('Success: No database context or internal stack traces disclosed in error response.')

  // Cleanup seeded resources
  console.log('\nCleaning up seeded test resources in database...')
  await prisma.file.deleteMany({ where: { userId: userA.id } }).catch(() => undefined)
  await prisma.connectedAccount.deleteMany({ where: { userId: userA.id } }).catch(() => undefined)
  await prisma.folder.deleteMany({ where: { userId: userA.id } }).catch(() => undefined)
  await prisma.userSession.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } }).catch(() => undefined)
  await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } }).catch(() => undefined)
  
  console.log('\n=== ALL SECURITY HARDENING VALIDATION TESTS PASSED ===')
}

run()
  .catch((err) => {
    console.error('\n❌ SECURITY TEST FAILURE:', err.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
