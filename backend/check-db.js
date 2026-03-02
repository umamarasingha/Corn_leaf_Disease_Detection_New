const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      password: true,
    },
  });

  console.log('Users in database:');
  console.log(JSON.stringify(users, null, 2));
  
  await prisma.$disconnect();
}

checkUsers().catch(console.error);
