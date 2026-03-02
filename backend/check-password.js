const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPassword() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      password: true,
    },
  });

  console.log('Users in database:');
  users.forEach(user => {
    console.log(`Email: ${user.email}`);
    console.log(`Password hash length: ${user.password.length}`);
    console.log(`Password hash: ${user.password}`);
    console.log('---');
  });

  // Check if the hash is correct length (60 chars for bcrypt)
  users.forEach(user => {
    if (user.password.length !== 60) {
      console.error(`ERROR: Password hash for ${user.email} is ${user.password.length} chars, should be 60`);
    }
  });

  await prisma.$disconnect();
}

checkPassword().catch(console.error);
