import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const duplicates = await prisma.$queryRaw`
    SELECT provider, provider_account_id, COUNT(*) as count
    FROM connected_accounts
    GROUP BY provider, provider_account_id
    HAVING count > 1
  `
  console.log('Duplicates found:', duplicates)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
