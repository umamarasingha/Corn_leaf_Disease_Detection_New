const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
  const result = await prisma.$queryRaw`PRAGMA table_info(User)`;
  console.log('User table schema:');
  console.table(result);
  
  await prisma.$disconnect();
}

checkSchema().catch(console.error);
