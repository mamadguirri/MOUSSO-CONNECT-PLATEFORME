import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Catégories
  const categories = [
    { name: 'Coiffure', slug: 'coiffure', iconName: 'scissors' },
    { name: 'Maquillage', slug: 'maquillage', iconName: 'sparkles' },
    { name: 'Henné', slug: 'henne', iconName: 'hand' },
    { name: 'Couture', slug: 'couture', iconName: 'shirt' },
    { name: 'Manucure', slug: 'manucure', iconName: 'hand-raised' },
    { name: 'Esthétique', slug: 'esthetique', iconName: 'star' },
    { name: 'Aide ménagère', slug: 'menage', iconName: 'home' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // Quartiers de Bamako
  const quartiers = [
    'Hamdallaye', 'Lafiabougou', 'Magnambougou', 'Badalabougou', 'Kalaban Coura',
    'Sogoniko', 'Sabalibougou', 'Missabougou', 'Sénou', 'Faladié',
    'Niamakoro', 'Daoudabougou', 'Quinzambougou', 'Korofina', 'Banconi',
  ];

  for (const name of quartiers) {
    const existing = await prisma.quartier.findFirst({ where: { name } });
    if (!existing) {
      await prisma.quartier.create({
        data: { name, ville: 'Bamako', region: 'Bamako' },
      });
    }
  }

  // Compte admin initial
  const adminPhone = process.env.ADMIN_PHONE || '+22300000000';
  const adminPassword = await bcrypt.hash('admin123', 10);
  const existingAdmin = await prisma.user.findUnique({ where: { phone: adminPhone } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        phone: adminPhone,
        name: 'Administrateur',
        role: 'ADMIN',
        accountType: 'FREE',
        passwordHash: adminPassword,
      },
    });
  } else if (!existingAdmin.passwordHash) {
    await prisma.user.update({
      where: { phone: adminPhone },
      data: { passwordHash: adminPassword },
    });
  }

  console.log('Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
