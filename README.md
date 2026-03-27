# Musso Connect

**Chaque femme mérite le succès**

Plateforme web mobile-first (PWA) qui met en relation des femmes prestataires de services artisanaux avec des clientes à Bamako, Mali.

## Installation locale

### Prérequis

- Node.js 20+
- Docker & Docker Compose (pour PostgreSQL)
- npm

### 1. Cloner et installer

```bash
git clone <repo-url>
cd musso-connect
npm install
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example apps/api/.env
```

Modifier `apps/api/.env` avec vos valeurs. Les valeurs par défaut fonctionnent en local.

### 3. Lancer PostgreSQL

```bash
docker-compose up -d
```

### 4. Initialiser la base de données

```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Lancer les serveurs de développement

```bash
# Depuis la racine
npm run dev
```

Ou séparément :

```bash
npm run dev:api   # API sur http://localhost:4000
npm run dev:web   # Frontend sur http://localhost:3000
```

## Variables d'environnement

Voir `.env.example` pour la liste complète.

## Commandes utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance API + frontend |
| `npm run dev:api` | Lance l'API seule |
| `npm run dev:web` | Lance le frontend seul |
| `npm run build` | Build production |
| `npm run db:migrate` | Exécuter les migrations |
| `npm run db:seed` | Peupler la base |
| `npm run db:studio` | Ouvrir Prisma Studio |

## Stack technique

- **Frontend** : Next.js 14, TailwindCSS, shadcn/ui
- **Backend** : Express.js, Prisma, PostgreSQL
- **Auth** : JWT (access + refresh tokens) + OTP SMS
- **Stockage** : Cloudflare R2
- **Déploiement** : Hetzner VPS, Nginx, PM2, GitHub Actions
