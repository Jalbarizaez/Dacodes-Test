import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSystemUser() {
  try {
    const systemUser = await prisma.user.upsert({
      where: { id: 'system' },
      update: {},
      create: {
        id: 'system',
        email: 'system@dacodes.com',
        passwordHash: '$2b$10$dummyhashforplaceholder',
        role: 'ADMIN',
        isActive: true,
      },
    });

    console.log('✅ System user created/updated:', systemUser);
  } catch (error) {
    console.error('❌ Error creating system user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSystemUser();
