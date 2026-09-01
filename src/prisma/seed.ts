import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';
import { Role, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

const cfg = {
  adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@usersvc.local',
  adminPassword: process.env.SEED_ADMIN_PASSWORD || 'admin123',
  seedDemoUsers: process.env.SEED_DEMO_USERS === 'true',
};

async function main() {
  const email = cfg.adminEmail;
  const role: Role = 'ADMIN';

  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const passwordHash = hashSync(cfg.adminPassword, 10);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        firstName: 'Admin',
        lastName: 'User',
      },
    });
    console.log(`Seeded admin user: ${email}`);
  } else {
    console.log(`Admin user already exists: ${email}`);
  }

  // Optional: seed a few demo users for the dashboard
  if (cfg.seedDemoUsers) {
    for (let i = 1; i <= 5; i++) {
      const demoEmail = `demo${i}@usersvc.local`;
      const demo = await prisma.user.findUnique({ where: { email: demoEmail } });
      if (!demo) {
        const passwordHash = hashSync('demo123', 10);
        await prisma.user.create({
          data: {
            email: demoEmail,
            passwordHash,
            role: Role.USER,
            status: UserStatus.ACTIVE,
            emailVerified: false,
            firstName: 'Demo',
            lastName: `User ${i}`,
          },
        });
        console.log(`Seeded demo user: ${demoEmail}`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });