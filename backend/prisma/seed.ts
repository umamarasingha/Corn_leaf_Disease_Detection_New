import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cornleaf.app' },
    update: {},
    create: {
      email: 'admin@cornleaf.app',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  console.log('Created admin user:', admin.email);

  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: hashedPassword,
      name: 'Test User',
      role: 'USER',
    },
  });

  console.log('Created test user:', user.email);

  const news = await prisma.news.create({
    data: {
      title: 'New Disease Detection Model Released',
      content: 'We are excited to announce the release of our new AI-powered disease detection model with improved accuracy and faster processing times.',
    },
  });

  console.log('Created news item:', news.title);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
