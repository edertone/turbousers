import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';
import { UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

const cfg = {
  adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@usersvc.local',
  adminPassword: process.env.SEED_ADMIN_PASSWORD || 'admin123',
  seedDemoUsers: process.env.SEED_DEMO_USERS === 'true',
};

async function ensureRoles() {
  await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description:
        'Full administrative access to users, roles and the dashboard.',
    },
  });
  await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: {
      name: 'USER',
      description: 'Standard user role.',
    },
  });
}

async function main() {
  const email = cfg.adminEmail;
  await ensureRoles();

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: 'ADMIN' },
  });

  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const passwordHash = hashSync(cfg.adminPassword, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        firstName: 'Admin',
        lastName: 'User',
      },
    });
    await prisma.userRole.create({
      data: { userId: user.id, roleId: adminRole.id },
    });
    console.log(`Seeded admin user: ${email}`);
  } else {
    console.log(`Admin user already exists: ${email}`);
  }

  // Optional: seed a few demo users for the dashboard
  if (cfg.seedDemoUsers) {
    const userRole = await prisma.role.findUniqueOrThrow({
      where: { name: 'USER' },
    });
    for (let i = 1; i <= 5; i++) {
      const demoEmail = `demo${i}@usersvc.local`;
      const demo = await prisma.user.findUnique({
        where: { email: demoEmail },
      });
      if (!demo) {
        const passwordHash = hashSync('demo123', 10);
        const demoUser = await prisma.user.create({
          data: {
            email: demoEmail,
            passwordHash,
            status: UserStatus.ACTIVE,
            emailVerified: false,
            firstName: 'Demo',
            lastName: `User ${i}`,
          },
        });
        await prisma.userRole.create({
          data: { userId: demoUser.id, roleId: userRole.id },
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
