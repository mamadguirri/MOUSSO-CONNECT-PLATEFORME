import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('=== PEUPLEMENT COMPLET DE MUSSO CONNECT ===\n');

  // ==========================================
  // 1. CATÉGORIES
  // ==========================================
  console.log('1. Création des catégories...');
  const categoriesData = [
    { name: 'Coiffure', slug: 'coiffure', iconName: 'scissors' },
    { name: 'Maquillage', slug: 'maquillage', iconName: 'sparkles' },
    { name: 'Henné', slug: 'henne', iconName: 'hand' },
    { name: 'Couture', slug: 'couture', iconName: 'shirt' },
    { name: 'Manucure', slug: 'manucure', iconName: 'hand-raised' },
    { name: 'Esthétique', slug: 'esthetique', iconName: 'star' },
    { name: 'Aide ménagère', slug: 'menage', iconName: 'home' },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories[cat.slug] = c.id;
  }
  console.log(`   ✅ ${Object.keys(categories).length} catégories`);

  // ==========================================
  // 2. QUARTIERS
  // ==========================================
  console.log('2. Création des quartiers...');
  const quartiersData = [
    // === BAMAKO - Quartiers détaillés ===
    { name: 'Hamdallaye',     ville: 'Bamako', region: 'Bamako', latitude: 12.6090, longitude: -8.0200 },
    { name: 'Lafiabougou',    ville: 'Bamako', region: 'Bamako', latitude: 12.6350, longitude: -8.0300 },
    { name: 'Magnambougou',   ville: 'Bamako', region: 'Bamako', latitude: 12.5850, longitude: -7.9700 },
    { name: 'Badalabougou',   ville: 'Bamako', region: 'Bamako', latitude: 12.6180, longitude: -8.0000 },
    { name: 'Kalaban Coura',  ville: 'Bamako', region: 'Bamako', latitude: 12.5750, longitude: -8.0400 },
    { name: 'Sogoniko',       ville: 'Bamako', region: 'Bamako', latitude: 12.5950, longitude: -7.9850 },
    { name: 'Sabalibougou',   ville: 'Bamako', region: 'Bamako', latitude: 12.6100, longitude: -8.0550 },
    { name: 'Missabougou',    ville: 'Bamako', region: 'Bamako', latitude: 12.6000, longitude: -7.9500 },
    { name: 'Sénou',          ville: 'Bamako', region: 'Bamako', latitude: 12.5400, longitude: -8.0000 },
    { name: 'Faladié',        ville: 'Bamako', region: 'Bamako', latitude: 12.5800, longitude: -7.9600 },
    { name: 'Niamakoro',      ville: 'Bamako', region: 'Bamako', latitude: 12.5700, longitude: -8.0100 },
    { name: 'Daoudabougou',   ville: 'Bamako', region: 'Bamako', latitude: 12.6300, longitude: -8.0500 },
    { name: 'Quinzambougou',  ville: 'Bamako', region: 'Bamako', latitude: 12.6500, longitude: -7.9900 },
    { name: 'Korofina',       ville: 'Bamako', region: 'Bamako', latitude: 12.6600, longitude: -8.0100 },
    { name: 'Banconi',        ville: 'Bamako', region: 'Bamako', latitude: 12.6700, longitude: -8.0350 },
    { name: 'ACI 2000',       ville: 'Bamako', region: 'Bamako', latitude: 12.6120, longitude: -8.0280 },
    { name: 'Djélibougou',    ville: 'Bamako', region: 'Bamako', latitude: 12.6550, longitude: -8.0200 },
    { name: 'Sotuba',         ville: 'Bamako', region: 'Bamako', latitude: 12.6650, longitude: -7.9800 },
    { name: 'Yirimadjo',      ville: 'Bamako', region: 'Bamako', latitude: 12.5650, longitude: -8.0500 },
    { name: 'Sikoroni',       ville: 'Bamako', region: 'Bamako', latitude: 12.6200, longitude: -8.0600 },
    // === KOULIKORO ===
    { name: 'Koulikoro',      ville: 'Koulikoro',   region: 'Koulikoro',   latitude: 12.8628, longitude: -7.5597 },
    { name: 'Kati',           ville: 'Kati',        region: 'Koulikoro',   latitude: 12.7447, longitude: -8.0714 },
    { name: 'Kolokani',       ville: 'Kolokani',    region: 'Koulikoro',   latitude: 13.5725, longitude: -8.0372 },
    { name: 'Kangaba',        ville: 'Kangaba',     region: 'Koulikoro',   latitude: 11.9333, longitude: -8.4167 },
    // === SIKASSO ===
    { name: 'Sikasso',        ville: 'Sikasso',     region: 'Sikasso',     latitude: 11.3174, longitude: -5.6800 },
    { name: 'Bougouni',       ville: 'Bougouni',    region: 'Sikasso',     latitude: 11.4174, longitude: -7.4839 },
    { name: 'Koutiala',       ville: 'Koutiala',    region: 'Sikasso',     latitude: 12.3899, longitude: -5.4621 },
    { name: 'Yanfolila',      ville: 'Yanfolila',   region: 'Sikasso',     latitude: 11.1700, longitude: -8.1500 },
    { name: 'Kadiolo',        ville: 'Kadiolo',     region: 'Sikasso',     latitude: 10.5500, longitude: -5.7667 },
    // === SÉGOU ===
    { name: 'Ségou',          ville: 'Ségou',       region: 'Ségou',       latitude: 13.4317, longitude: -5.6844 },
    { name: 'San',            ville: 'San',         region: 'Ségou',       latitude: 13.3000, longitude: -4.8833 },
    { name: 'Niono',          ville: 'Niono',       region: 'Ségou',       latitude: 14.2500, longitude: -5.9833 },
    { name: 'Bla',            ville: 'Bla',         region: 'Ségou',       latitude: 12.9500, longitude: -5.7500 },
    // === MOPTI ===
    { name: 'Mopti',          ville: 'Mopti',       region: 'Mopti',       latitude: 14.4843, longitude: -4.1870 },
    { name: 'Djenné',         ville: 'Djenné',      region: 'Mopti',       latitude: 13.9053, longitude: -4.5553 },
    { name: 'Bandiagara',     ville: 'Bandiagara',  region: 'Mopti',       latitude: 14.3500, longitude: -3.6100 },
    { name: 'Douentza',       ville: 'Douentza',    region: 'Mopti',       latitude: 15.0000, longitude: -2.9500 },
    // === KAYES ===
    { name: 'Kayes',          ville: 'Kayes',       region: 'Kayes',       latitude: 14.4491, longitude: -11.4405 },
    { name: 'Kéniéba',        ville: 'Kéniéba',     region: 'Kayes',       latitude: 12.8333, longitude: -11.2333 },
    { name: 'Kita',           ville: 'Kita',        region: 'Kayes',       latitude: 13.0333, longitude: -9.4833 },
    { name: 'Nioro du Sahel', ville: 'Nioro du Sahel', region: 'Kayes',    latitude: 15.2333, longitude: -9.5833 },
    // === TOMBOUCTOU ===
    { name: 'Tombouctou',     ville: 'Tombouctou',  region: 'Tombouctou',  latitude: 16.7735, longitude: -3.0074 },
    { name: 'Diré',           ville: 'Diré',        region: 'Tombouctou',  latitude: 16.2667, longitude: -3.3833 },
    // === GAO ===
    { name: 'Gao',            ville: 'Gao',         region: 'Gao',         latitude: 16.2716, longitude: -0.0434 },
    { name: 'Ansongo',        ville: 'Ansongo',     region: 'Gao',         latitude: 15.6614, longitude: 0.5028  },
    // === KIDAL ===
    { name: 'Kidal',          ville: 'Kidal',       region: 'Kidal',       latitude: 18.4411, longitude: 1.4078  },
    // === MÉNAKA ===
    { name: 'Ménaka',         ville: 'Ménaka',      region: 'Ménaka',      latitude: 15.9167, longitude: 2.4000  },
    // === TAOUDÉNIT ===
    { name: 'Taoudénit',      ville: 'Taoudénit',   region: 'Taoudénit',   latitude: 22.6781, longitude: -3.9836 },
  ];

  const quartiers: Record<string, string> = {};
  for (const qData of quartiersData) {
    const existing = await prisma.quartier.findFirst({ where: { name: qData.name, region: qData.region } });
    if (existing) {
      await prisma.quartier.update({ where: { id: existing.id }, data: { latitude: qData.latitude, longitude: qData.longitude, ville: qData.ville, region: qData.region } });
      quartiers[qData.name] = existing.id;
    } else {
      const q = await prisma.quartier.create({ data: { name: qData.name, ville: qData.ville, region: qData.region, latitude: qData.latitude, longitude: qData.longitude } });
      quartiers[qData.name] = q.id;
    }
  }
  console.log(`   ✅ ${Object.keys(quartiers).length} localités (${quartiersData.filter(q => q.region === 'Bamako').length} quartiers Bamako + ${quartiersData.filter(q => q.region !== 'Bamako').length} villes Mali)`);

  // ==========================================
  // 3. MOT DE PASSE COMMUN
  // ==========================================
  const passwordHash = await bcrypt.hash('test1234', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  // ==========================================
  // 4. ADMIN
  // ==========================================
  console.log('3. Création du compte admin...');
  const admin = await prisma.user.upsert({
    where: { phone: '+22300000000' },
    update: { passwordHash: adminPasswordHash },
    create: {
      phone: '+22300000000',
      name: 'Admin Musso',
      role: 'ADMIN',
      accountType: 'FREE',
      passwordHash: adminPasswordHash,
      quartierId: quartiers['Hamdallaye'],
    },
  });
  console.log(`   ✅ Admin: +22300000000 / admin123`);

  // ==========================================
  // 5. CLIENTES
  // ==========================================
  console.log('4. Création des comptes clientes...');
  const clientsData = [
    { phone: '+22370000001', name: 'Aminata Diallo', quartier: 'Hamdallaye' },
    { phone: '+22370000002', name: 'Fatoumata Keita', quartier: 'Lafiabougou' },
    { phone: '+22370000003', name: 'Mariam Traoré', quartier: 'Badalabougou' },
    { phone: '+22370000004', name: 'Oumou Sangaré', quartier: 'Kalaban Coura' },
    { phone: '+22370000005', name: 'Kadiatou Coulibaly', quartier: 'Niamakoro' },
  ];

  const clients: any[] = [];
  for (const c of clientsData) {
    const user = await prisma.user.upsert({
      where: { phone: c.phone },
      update: { passwordHash, name: c.name, quartierId: quartiers[c.quartier] },
      create: {
        phone: c.phone,
        name: c.name,
        role: 'CLIENT',
        accountType: 'FREE',
        passwordHash,
        quartierId: quartiers[c.quartier],
      },
    });
    clients.push(user);
  }
  console.log(`   ✅ ${clients.length} clientes (mot de passe: test1234)`);

  // ==========================================
  // 6. PRESTATAIRES
  // ==========================================
  console.log('5. Création des prestataires...');
  const providersData = [
    {
      phone: '+22380000001',
      name: 'Awa Konaté',
      quartier: 'Hamdallaye',
      bio: 'Coiffeuse professionnelle avec 8 ans d\'expérience. Spécialiste tresses africaines, tissages et soins capillaires. Je me déplace à domicile dans tout Bamako.',
      whatsapp: '+22380000001',
      services: [
        { slug: 'coiffure', desc: 'Tresses, tissages, lissage brésilien, soins capillaires', price: '5 000 - 50 000' },
        { slug: 'esthetique', desc: 'Soins du visage et conseils beauté', price: '3 000 - 15 000' },
      ],
    },
    {
      phone: '+22380000002',
      name: 'Djénéba Sacko',
      quartier: 'Lafiabougou',
      bio: 'Maquilleuse et artiste henné. Formation à Dakar et Abidjan. Mariages, cérémonies, événements. Résultats garantis !',
      whatsapp: '+22380000002',
      services: [
        { slug: 'maquillage', desc: 'Maquillage mariée, soirée, photo shoot, maquillage naturel', price: '10 000 - 75 000' },
        { slug: 'henne', desc: 'Henné traditionnel malien, henné moderne, henné mariée', price: '5 000 - 40 000' },
      ],
    },
    {
      phone: '+22380000003',
      name: 'Rokia Diabaté',
      quartier: 'Magnambougou',
      bio: 'Couturière de haute couture. Bazin, boubou, robes de cérémonie. Chaque création est unique et sur mesure.',
      whatsapp: '+22380000003',
      services: [
        { slug: 'couture', desc: 'Boubou, bazin riche, robes de mariée, tenues de fête', price: '15 000 - 150 000' },
      ],
    },
    {
      phone: '+22380000004',
      name: 'Sira Kamissoko',
      quartier: 'Badalabougou',
      bio: 'Spécialiste manucure/pédicure et soins esthétiques. Produits de qualité importés. Espace propre et climatisé.',
      whatsapp: '+22380000004',
      services: [
        { slug: 'manucure', desc: 'Manucure classique, gel, pose de faux ongles, nail art', price: '3 000 - 25 000' },
        { slug: 'esthetique', desc: 'Pédicure, gommage, soins corps complet', price: '5 000 - 30 000' },
      ],
    },
    {
      phone: '+22380000005',
      name: 'Assétou Bagayoko',
      quartier: 'Kalaban Coura',
      bio: 'Coiffeuse et maquilleuse polyvalente. Plus de 5 ans d\'expérience. Travail soigné et ponctualité garantie.',
      whatsapp: '+22380000005',
      services: [
        { slug: 'coiffure', desc: 'Tresses collées, vanilles, crochet braids, perruques', price: '3 000 - 35 000' },
        { slug: 'maquillage', desc: 'Maquillage jour et soirée, maquillage effet naturel', price: '5 000 - 30 000' },
      ],
    },
    {
      phone: '+22380000006',
      name: 'Nana Cissé',
      quartier: 'Sogoniko',
      bio: 'Service d\'aide ménagère professionnel. Ménage, repassage, cuisine. Personnel formé et de confiance.',
      whatsapp: '+22380000006',
      services: [
        { slug: 'menage', desc: 'Ménage complet, repassage, cuisine, garde d\'enfants', price: '5 000 - 15 000/jour' },
      ],
    },
    {
      phone: '+22380000007',
      name: 'Fanta Sidibé',
      quartier: 'Faladié',
      bio: 'Artiste henné reconnue à Bamako. Modèles traditionnels et modernes. Interventions mariages et baptêmes.',
      whatsapp: '+22380000007',
      services: [
        { slug: 'henne', desc: 'Henné mains et pieds, designs modernes, henné noir', price: '3 000 - 25 000' },
        { slug: 'manucure', desc: 'Manucure simple et pose vernis semi-permanent', price: '2 000 - 10 000' },
      ],
    },
    {
      phone: '+22380000008',
      name: 'Tenin Dembélé',
      quartier: 'Banconi',
      bio: 'Esthéticienne diplômée. Soins visage, corps, épilation. J\'utilise des produits naturels et bio quand possible.',
      whatsapp: '+22380000008',
      services: [
        { slug: 'esthetique', desc: 'Soins visage, masques, gommage, épilation, massage', price: '5 000 - 40 000' },
        { slug: 'maquillage', desc: 'Maquillage professionnel tous événements', price: '10 000 - 50 000' },
      ],
    },
    {
      phone: '+22380000009',
      name: 'Bintou Touré',
      quartier: 'Niamakoro',
      bio: 'Couturière spécialisée en tenues traditionnelles maliennes. Bazin brodé, boubou de luxe. Qualité premium.',
      whatsapp: '+22380000009',
      services: [
        { slug: 'couture', desc: 'Bazin brodé, boubou traditionnel, tenues de baptême', price: '20 000 - 200 000' },
        { slug: 'couture', desc: 'Retouches et ajustements', price: '2 000 - 10 000' },
      ],
    },
    {
      phone: '+22380000010',
      name: 'Hawa Diarra',
      quartier: 'Korofina',
      bio: 'Coiffeuse à domicile. Tresses, tissages, locks, soins naturels. Disponible 7j/7. Déplacement gratuit à Bamako.',
      whatsapp: '+22380000010',
      services: [
        { slug: 'coiffure', desc: 'Locks, dreadlocks, tresses jumbo, coupe femme', price: '5 000 - 45 000' },
      ],
    },
  ];

  const providers: any[] = [];
  for (const p of providersData) {
    // Créer l'utilisateur
    const user = await prisma.user.upsert({
      where: { phone: p.phone },
      update: { passwordHash, name: p.name, role: 'PROVIDER', accountType: 'PROVIDER', quartierId: quartiers[p.quartier] },
      create: {
        phone: p.phone,
        name: p.name,
        role: 'PROVIDER',
        accountType: 'PROVIDER',
        passwordHash,
        quartierId: quartiers[p.quartier],
      },
    });

    // Supprimer ancien provider si existant
    const existing = await prisma.provider.findUnique({ where: { userId: user.id } });
    if (existing) {
      await prisma.review.deleteMany({ where: { providerId: existing.id } });
      await prisma.booking.deleteMany({ where: { providerId: existing.id } });
      await prisma.message.deleteMany({ where: { conversation: { providerId: existing.id } } });
      await prisma.conversation.deleteMany({ where: { providerId: existing.id } });
      await prisma.servicePhoto.deleteMany({ where: { service: { providerId: existing.id } } });
      await prisma.providerService.deleteMany({ where: { providerId: existing.id } });
      await prisma.provider.delete({ where: { id: existing.id } });
    }

    // Coordonnées GPS : quartier + petit décalage aléatoire
    const qCoords = quartiersData.find(q => q.name === p.quartier);
    const latOffset = (Math.random() - 0.5) * 0.004; // ~200m
    const lngOffset = (Math.random() - 0.5) * 0.004;

    // Créer le provider
    const provider = await prisma.provider.create({
      data: {
        userId: user.id,
        bio: p.bio,
        whatsappNumber: p.whatsapp,
        isVerified: Math.random() > 0.3, // 70% vérifiées
        latitude: qCoords ? qCoords.latitude + latOffset : null,
        longitude: qCoords ? qCoords.longitude + lngOffset : null,
      },
    });

    // Créer les services (éviter doublons de catégorie)
    const addedCategories = new Set<string>();
    for (const s of p.services) {
      const catId = categories[s.slug];
      if (catId && !addedCategories.has(catId)) {
        addedCategories.add(catId);
        await prisma.providerService.create({
          data: {
            providerId: provider.id,
            categoryId: catId,
            description: s.desc,
            priceRange: s.price,
          },
        });
      }
    }

    providers.push({ user, provider });
  }
  console.log(`   ✅ ${providers.length} prestataires (mot de passe: test1234)`);

  // ==========================================
  // 7. RÉSERVATIONS
  // ==========================================
  console.log('6. Création des réservations...');

  const bookingStatuses = ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'] as const;
  let bookingCount = 0;

  // Générer des réservations réalistes
  const bookingsData = [
    // Aminata réserve chez Awa (coiffure)
    { clientIdx: 0, providerIdx: 0, date: '2026-04-01', time: '09:00', note: 'Je voudrais des tresses collées, cheveux moyens', status: 'PENDING' },
    { clientIdx: 0, providerIdx: 1, date: '2026-04-05', time: '14:00', note: 'Maquillage pour un mariage le samedi', status: 'ACCEPTED' },
    // Fatoumata réserve chez Rokia (couture)
    { clientIdx: 1, providerIdx: 2, date: '2026-03-20', time: '10:00', note: 'Boubou en bazin pour un baptême, tissu déjà acheté', status: 'COMPLETED' },
    { clientIdx: 1, providerIdx: 3, date: '2026-04-10', time: '15:00', note: 'Manucure gel avec nail art', status: 'PENDING' },
    // Mariam réserve
    { clientIdx: 2, providerIdx: 4, date: '2026-03-25', time: '11:00', note: 'Tresses vanilles pour ma fille', status: 'COMPLETED' },
    { clientIdx: 2, providerIdx: 5, date: '2026-04-02', time: '08:00', note: 'Ménage complet appartement 3 pièces', status: 'ACCEPTED' },
    { clientIdx: 2, providerIdx: 6, date: '2026-04-08', time: '16:00', note: 'Henné pour mon mariage, mains et pieds', status: 'PENDING' },
    // Oumou réserve
    { clientIdx: 3, providerIdx: 7, date: '2026-03-22', time: '13:00', note: 'Soin visage complet + gommage', status: 'COMPLETED' },
    { clientIdx: 3, providerIdx: 0, date: '2026-04-03', time: '10:00', note: 'Tissage brésilien', status: 'PENDING' },
    { clientIdx: 3, providerIdx: 8, date: '2026-03-15', time: '09:00', note: 'Bazin brodé pour fête de fin d\'année', status: 'COMPLETED' },
    // Kadiatou réserve
    { clientIdx: 4, providerIdx: 1, date: '2026-04-12', time: '16:00', note: 'Henné pour la sœur de mon amie', status: 'PENDING' },
    { clientIdx: 4, providerIdx: 9, date: '2026-03-28', time: '14:00', note: 'Coupe et coiffure moderne', status: 'ACCEPTED' },
    { clientIdx: 4, providerIdx: 3, date: '2026-03-18', time: '11:00', note: 'Pédicure + pose vernis', status: 'COMPLETED' },
    // Plus de réservations rejetées/annulées
    { clientIdx: 0, providerIdx: 5, date: '2026-03-10', time: '08:00', note: 'Ménage urgent', status: 'REJECTED', rejectionReason: 'Désolée, je suis complète cette semaine' },
    { clientIdx: 1, providerIdx: 0, date: '2026-03-12', time: '10:00', note: 'Tresses pour un événement', status: 'CANCELLED' },
  ];

  for (const b of bookingsData) {
    const client = clients[b.clientIdx];
    const { provider } = providers[b.providerIdx];

    // Trouver un service de ce provider
    const service = await prisma.providerService.findFirst({
      where: { providerId: provider.id },
    });

    if (service) {
      await prisma.booking.create({
        data: {
          clientId: client.id,
          providerId: provider.id,
          serviceId: service.id,
          requestedDate: new Date(b.date),
          requestedTime: b.time,
          note: b.note,
          clientPhone: client.phone,
          status: b.status as any,
          rejectionReason: (b as any).rejectionReason || null,
        },
      });
      bookingCount++;
    }
  }
  console.log(`   ✅ ${bookingCount} réservations`);

  // ==========================================
  // 8. CONVERSATIONS & MESSAGES
  // ==========================================
  console.log('7. Création des conversations et messages...');

  let convCount = 0;
  let msgCount = 0;

  // Conversation 1: Aminata <-> Awa (coiffure)
  const conv1 = await prisma.conversation.create({
    data: {
      clientId: clients[0].id,
      providerId: providers[0].provider.id,
      lastMessageAt: new Date('2026-03-28T10:30:00'),
    },
  });
  const conv1Messages = [
    { senderId: clients[0].id, content: 'Bonjour ! Vous faites les tresses collées ?', time: '2026-03-27T14:00:00' },
    { senderId: providers[0].user.id, content: 'Bonjour Aminata ! Oui je fais tous les types de tresses. Vous avez une préférence ?', time: '2026-03-27T14:15:00' },
    { senderId: clients[0].id, content: 'Je voudrais des tresses collées avec des rajouts. C\'est combien ?', time: '2026-03-27T14:20:00' },
    { senderId: providers[0].user.id, content: 'Pour les tresses collées avec rajouts, c\'est entre 15 000 et 25 000 FCFA selon la longueur. Vous voulez quand ?', time: '2026-03-27T14:30:00' },
    { senderId: clients[0].id, content: 'D\'accord ! Mardi prochain ça serait possible ? Le matin de préférence', time: '2026-03-27T14:35:00' },
    { senderId: providers[0].user.id, content: 'Oui mardi 9h ça vous convient ? Je me déplace à domicile', time: '2026-03-27T14:40:00' },
    { senderId: clients[0].id, content: 'Parfait ! Je suis à Hamdallaye ACI. Je vous envoie la localisation le jour même', time: '2026-03-27T14:45:00' },
    { senderId: providers[0].user.id, content: 'Super, c\'est noté ! À mardi In Sha Allah 🙏', time: '2026-03-27T14:50:00' },
    { senderId: clients[0].id, content: 'Merci beaucoup ! À mardi', time: '2026-03-28T10:30:00' },
  ];
  for (const m of conv1Messages) {
    await prisma.message.create({
      data: {
        conversationId: conv1.id,
        senderId: m.senderId,
        type: 'TEXT',
        content: m.content,
        isRead: true,
        createdAt: new Date(m.time),
      },
    });
    msgCount++;
  }
  convCount++;

  // Conversation 2: Fatoumata <-> Rokia (couture)
  const conv2 = await prisma.conversation.create({
    data: {
      clientId: clients[1].id,
      providerId: providers[2].provider.id,
      lastMessageAt: new Date('2026-03-28T09:00:00'),
    },
  });
  const conv2Messages = [
    { senderId: clients[1].id, content: 'Bonjour Rokia ! On m\'a recommandé vos services pour la couture en bazin', time: '2026-03-26T08:00:00' },
    { senderId: providers[2].user.id, content: 'Bonjour ! Merci de me contacter. Oui je fais le bazin brodé et les boubous. Vous cherchez quoi exactement ?', time: '2026-03-26T08:30:00' },
    { senderId: clients[1].id, content: 'J\'ai un baptême dans 2 semaines. Je voudrais un boubou en bazin riche rose', time: '2026-03-26T08:35:00' },
    { senderId: providers[2].user.id, content: 'Très bien ! Pour un bazin riche brodé, il faut compter environ 75 000 FCFA avec le tissu, ou 45 000 si vous apportez le bazin', time: '2026-03-26T08:45:00' },
    { senderId: clients[1].id, content: 'J\'ai déjà acheté le tissu. 45 000 c\'est parfait. Quand est-ce que je peux passer pour les mesures ?', time: '2026-03-26T09:00:00' },
    { senderId: providers[2].user.id, content: 'Vous pouvez venir demain après-midi à Magnambougou. Je vous envoie la localisation ?', time: '2026-03-26T09:10:00' },
    { senderId: clients[1].id, content: 'Oui envoyez la localisation svp !', time: '2026-03-26T09:15:00' },
    { senderId: providers[2].user.id, content: 'C\'est bien reçu, votre boubou est prêt ! Vous pouvez passer le récupérer quand vous voulez', time: '2026-03-28T09:00:00', isRead: false },
  ];
  for (const m of conv2Messages) {
    await prisma.message.create({
      data: {
        conversationId: conv2.id,
        senderId: m.senderId,
        type: 'TEXT',
        content: m.content,
        isRead: (m as any).isRead !== undefined ? (m as any).isRead : true,
        createdAt: new Date(m.time),
      },
    });
    msgCount++;
  }
  convCount++;

  // Conversation 3: Mariam <-> Fanta (henné)
  const conv3 = await prisma.conversation.create({
    data: {
      clientId: clients[2].id,
      providerId: providers[6].provider.id,
      lastMessageAt: new Date('2026-03-28T11:00:00'),
    },
  });
  const conv3Messages = [
    { senderId: clients[2].id, content: 'Salam ! Je prépare mon mariage et je cherche une artiste henné', time: '2026-03-27T18:00:00' },
    { senderId: providers[6].user.id, content: 'Wa alaikum salam ! Félicitations pour votre mariage ! Je fais le henné traditionnel et moderne. C\'est quand le mariage ?', time: '2026-03-27T18:20:00' },
    { senderId: clients[2].id, content: 'Le 8 avril In Sha Allah. Je voudrais le henné la veille, le 7 avril', time: '2026-03-27T18:25:00' },
    { senderId: providers[6].user.id, content: 'C\'est noté ! Pour le henné mariée complet (mains et pieds avec designs élaborés) c\'est 20 000 FCFA. Ça vous convient ?', time: '2026-03-27T18:30:00' },
    { senderId: clients[2].id, content: 'Oui c\'est bon ! Est-ce que vous pouvez aussi faire les mains de ma mère et ma sœur ?', time: '2026-03-27T18:35:00' },
    { senderId: providers[6].user.id, content: 'Bien sûr ! Pour les mains uniquement c\'est 8 000 FCFA par personne. Donc 20 000 + 16 000 = 36 000 FCFA le tout', time: '2026-03-27T18:40:00' },
    { senderId: clients[2].id, content: 'D\'accord on fait comme ça ! Je fais la réservation', time: '2026-03-27T18:45:00' },
    { senderId: providers[6].user.id, content: 'Parfait ! J\'ai bien reçu votre réservation. Vous n\'allez pas regretter In Sha Allah ! 💫', time: '2026-03-28T11:00:00', isRead: false },
  ];
  for (const m of conv3Messages) {
    await prisma.message.create({
      data: {
        conversationId: conv3.id,
        senderId: m.senderId,
        type: 'TEXT',
        content: m.content,
        isRead: (m as any).isRead !== undefined ? (m as any).isRead : true,
        createdAt: new Date(m.time),
      },
    });
    msgCount++;
  }
  convCount++;

  // Conversation 4: Oumou <-> Tenin (esthétique) - avec message non lu
  const conv4 = await prisma.conversation.create({
    data: {
      clientId: clients[3].id,
      providerId: providers[7].provider.id,
      lastMessageAt: new Date('2026-03-28T08:00:00'),
    },
  });
  const conv4Messages = [
    { senderId: clients[3].id, content: 'Bonjour ! Votre soin visage inclut quoi exactement ?', time: '2026-03-25T10:00:00' },
    { senderId: providers[7].user.id, content: 'Bonjour Oumou ! Le soin visage complet inclut : nettoyage, gommage, masque, hydratation et massage facial. Environ 1h30', time: '2026-03-25T10:30:00' },
    { senderId: clients[3].id, content: 'Super ! J\'ai la peau sensible, c\'est un problème ?', time: '2026-03-25T10:35:00' },
    { senderId: providers[7].user.id, content: 'Pas du tout ! J\'ai des produits spéciaux pour peaux sensibles. Je fais un test avant chaque soin', time: '2026-03-25T10:40:00' },
    { senderId: clients[3].id, content: 'J\'ai bien aimé le soin ! Ma peau est magnifique. Merci Tenin ! ❤️', time: '2026-03-27T16:00:00' },
    { senderId: providers[7].user.id, content: 'Merci beaucoup Oumou ! Ravie que ça vous ait plu. N\'hésitez pas à revenir, je recommande un soin toutes les 3 semaines 😊', time: '2026-03-28T08:00:00', isRead: false },
  ];
  for (const m of conv4Messages) {
    await prisma.message.create({
      data: {
        conversationId: conv4.id,
        senderId: m.senderId,
        type: 'TEXT',
        content: m.content,
        isRead: (m as any).isRead !== undefined ? (m as any).isRead : true,
        createdAt: new Date(m.time),
      },
    });
    msgCount++;
  }
  convCount++;

  // Conversation 5: Kadiatou <-> Djénéba (maquillage)
  const conv5 = await prisma.conversation.create({
    data: {
      clientId: clients[4].id,
      providerId: providers[1].provider.id,
      lastMessageAt: new Date('2026-03-27T20:00:00'),
    },
  });
  const conv5Messages = [
    { senderId: clients[4].id, content: 'Bonsoir ! Vous êtes disponible pour un maquillage de soirée samedi prochain ?', time: '2026-03-27T19:00:00' },
    { senderId: providers[1].user.id, content: 'Bonsoir Kadiatou ! Oui je suis dispo samedi. C\'est pour quelle occasion ?', time: '2026-03-27T19:15:00' },
    { senderId: clients[4].id, content: 'Un gala de charité. Je voudrais quelque chose d\'élégant mais pas trop', time: '2026-03-27T19:20:00' },
    { senderId: providers[1].user.id, content: 'Je vois très bien ! Un maquillage soirée élégant c\'est 25 000 FCFA. Vous avez une préférence de couleurs ?', time: '2026-03-27T19:30:00' },
    { senderId: clients[4].id, content: 'Des tons dorés et bruns. Ma robe est bordeaux', time: '2026-03-27T19:35:00' },
    { senderId: providers[1].user.id, content: 'Parfait, les dorés iront très bien avec du bordeaux ! RDV samedi à quelle heure ?', time: '2026-03-27T20:00:00' },
  ];
  for (const m of conv5Messages) {
    await prisma.message.create({
      data: {
        conversationId: conv5.id,
        senderId: m.senderId,
        type: 'TEXT',
        content: m.content,
        isRead: true,
        createdAt: new Date(m.time),
      },
    });
    msgCount++;
  }
  convCount++;

  console.log(`   ✅ ${convCount} conversations, ${msgCount} messages`);

  // ==========================================
  // 9. AVIS / REVIEWS
  // ==========================================
  console.log('8. Création des avis et notations...');
  let reviewCount = 0;

  const reviewsData = [
    // Avis sur Awa Konaté (coiffure) - provider 0
    { clientIdx: 0, providerIdx: 0, rating: 5, comment: 'Excellent travail ! Mes tresses sont magnifiques, je recommande à 100%' },
    { clientIdx: 3, providerIdx: 0, rating: 4, comment: 'Très bonne coiffeuse, ponctuelle. Le tissage tient bien depuis 2 semaines' },
    // Avis sur Djénéba Sacko (maquillage) - provider 1
    { clientIdx: 0, providerIdx: 1, rating: 5, comment: 'Le maquillage était parfait pour le mariage ! Tout le monde m\'a complimentée' },
    { clientIdx: 4, providerIdx: 1, rating: 5, comment: 'Maquilleuse très talentueuse. Elle sait exactement quel style convient à chaque visage' },
    // Avis sur Rokia Diabaté (couture) - provider 2
    { clientIdx: 1, providerIdx: 2, rating: 5, comment: 'Mon boubou en bazin est splendide ! La broderie est impeccable. Merci Rokia !' },
    { clientIdx: 2, providerIdx: 2, rating: 4, comment: 'Bon travail de couture, mais il a fallu attendre un peu plus que prévu' },
    // Avis sur Sira Kamissoko (manucure) - provider 3
    { clientIdx: 1, providerIdx: 3, rating: 4, comment: 'Belle manucure gel, très propre. Je reviendrai !' },
    { clientIdx: 4, providerIdx: 3, rating: 5, comment: 'Les meilleurs ongles de Bamako ! Nail art superbe et longue tenue' },
    { clientIdx: 2, providerIdx: 3, rating: 3, comment: 'Correct mais un peu cher pour le service proposé' },
    // Avis sur Assétou Bagayoko (coiffure/maquillage) - provider 4
    { clientIdx: 2, providerIdx: 4, rating: 5, comment: 'Ma fille était ravie de ses vanilles ! Assétou est très douce avec les enfants' },
    { clientIdx: 0, providerIdx: 4, rating: 4, comment: 'Bon maquillage, bien réalisé. Je recommande' },
    // Avis sur Nana Cissé (ménage) - provider 5
    { clientIdx: 2, providerIdx: 5, rating: 5, comment: 'Appartement impeccable ! Nana est sérieuse et très professionnelle' },
    { clientIdx: 0, providerIdx: 5, rating: 4, comment: 'Bon service de ménage, maison propre. Un peu en retard le matin' },
    // Avis sur Fanta Sidibé (henné) - provider 6
    { clientIdx: 2, providerIdx: 6, rating: 5, comment: 'Le henné de mon mariage était magnifique ! Tous les invités ont adoré les motifs' },
    { clientIdx: 3, providerIdx: 6, rating: 4, comment: 'Beaux designs de henné, la couleur a bien tenu' },
    // Avis sur Tenin Dembélé (esthétique) - provider 7
    { clientIdx: 3, providerIdx: 7, rating: 5, comment: 'Ma peau est magnifique après le soin ! Tenin est une vraie professionnelle' },
    { clientIdx: 1, providerIdx: 7, rating: 4, comment: 'Bon soin du visage, ambiance relaxante. Je recommande' },
    // Avis sur Bintou Touré (couture) - provider 8
    { clientIdx: 3, providerIdx: 8, rating: 5, comment: 'Bazin brodé exceptionnel ! La qualité est au rendez-vous. Merci Bintou' },
    // Avis sur Hawa Diarra (coiffure) - provider 9
    { clientIdx: 4, providerIdx: 9, rating: 4, comment: 'Bonne coiffeuse, elle se déplace rapidement. Les locks sont bien faits' },
    { clientIdx: 1, providerIdx: 9, rating: 5, comment: 'Hawa est la meilleure pour les tresses jumbo ! Très satisfaite' },
  ];

  for (const r of reviewsData) {
    const client = clients[r.clientIdx];
    const { provider } = providers[r.providerIdx];
    await prisma.review.upsert({
      where: {
        clientId_providerId: {
          clientId: client.id,
          providerId: provider.id,
        },
      },
      update: { rating: r.rating, comment: r.comment },
      create: {
        clientId: client.id,
        providerId: provider.id,
        rating: r.rating,
        comment: r.comment,
      },
    });
    reviewCount++;
  }
  console.log(`   ✅ ${reviewCount} avis`);

  // ==========================================
  // RÉSUMÉ
  // ==========================================
  console.log('\n========================================');
  console.log('     PEUPLEMENT TERMINÉ AVEC SUCCÈS !');
  console.log('========================================\n');
  console.log('📋 COMPTES DE TEST :');
  console.log('');
  console.log('👑 ADMIN :');
  console.log('   Tél: 00000000  |  MDP: admin123');
  console.log('');
  console.log('👩 CLIENTES (MDP: test1234) :');
  for (const c of clientsData) {
    console.log(`   ${c.name.padEnd(22)} Tél: ${c.phone.replace('+223', '')}`);
  }
  console.log('');
  console.log('💼 PRESTATAIRES (MDP: test1234) :');
  for (const p of providersData) {
    const serviceNames = [...new Set(p.services.map(s => s.slug))].join(', ');
    console.log(`   ${p.name.padEnd(22)} Tél: ${p.phone.replace('+223', '')}  |  ${serviceNames}`);
  }
  console.log('');
  console.log('📊 DONNÉES :');
  console.log(`   ${Object.keys(categories).length} catégories`);
  console.log(`   ${Object.keys(quartiers).length} quartiers`);
  console.log(`   ${clients.length} clientes`);
  console.log(`   ${providers.length} prestataires`);
  console.log(`   ${bookingCount} réservations`);
  console.log(`   ${convCount} conversations (${msgCount} messages)`);
  console.log(`   ${reviewCount} avis`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
