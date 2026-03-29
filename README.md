# Musso Connect

**Plateforme PWA de mise en relation avec les prestataires artisanes de Bamako, Mali.**

Musso Connect permet aux femmes artisanes (couturieres, coiffeuses, traiteurs, etc.) de proposer leurs services et aux clientes de les decouvrir, reserver et echanger directement via la plateforme.

---

## Tech Stack

| Couche | Technologies |
|--------|-------------|
| **Frontend** | Next.js 14, React 18, TailwindCSS, TanStack Query, Lucide Icons |
| **Backend** | Express.js, TypeScript, Zod, Helmet, express-rate-limit |
| **Base de donnees** | PostgreSQL 16 + Prisma ORM |
| **Auth** | JWT (access + refresh tokens), OTP par SMS (Twilio) |
| **Stockage** | Cloudflare R2 (production), systeme de fichiers local (dev) |
| **Monorepo** | npm workspaces |
| **Runtime** | Node.js 20+, tsx (dev) |

---

## Architecture du projet

```
musso-connect/
├── apps/
│   ├── api/                    # Backend Express + Prisma
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Modeles de donnees
│   │   │   ├── seed.ts         # Donnees initiales
│   │   │   └── migrations/     # Migrations DB
│   │   └── src/
│   │       ├── index.ts        # Point d'entree serveur
│   │       ├── controllers/    # Logique metier
│   │       ├── routes/         # Definition des routes
│   │       ├── middlewares/    # Auth, upload, erreurs
│   │       ├── services/      # SMS, stockage, notifications
│   │       └── lib/           # Prisma client, JWT
│   └── web/                    # Frontend Next.js 14
│       └── src/
│           ├── app/            # App Router (pages)
│           │   ├── (public)/   # Page d'accueil
│           │   ├── auth/       # Login, register, mot de passe
│           │   ├── search/     # Recherche prestataires
│           │   ├── providers/  # Profil prestataire
│           │   ├── bookings/   # Reservations
│           │   ├── messages/   # Messagerie
│           │   ├── formations/ # Formations en ligne
│           │   ├── notifications/
│           │   ├── dashboard/  # Tableau de bord prestataire
│           │   ├── become-provider/
│           │   └── admin/      # Panel admin
│           ├── components/     # Composants reutilisables
│           ├── hooks/          # Hooks personnalises
│           └── lib/            # Utilitaires, client API
└── packages/
    └── shared/                 # Types et constantes partagees
```

---

## Modeles de donnees

| Modele | Description |
|--------|-------------|
| **User** | Utilisateur (CLIENT, PROVIDER, ADMIN) avec telephone, quartier, type de compte |
| **Provider** | Profil prestataire : bio, avatar, WhatsApp, geolocalisation, verification |
| **Category** | Categories de services (couture, coiffure, cuisine, etc.) |
| **ProviderService** | Service propose par une prestataire (categorie, prix, photos) |
| **Quartier** | Quartiers de Bamako avec coordonnees GPS |
| **Booking** | Reservation d'un service (PENDING, ACCEPTED, REJECTED, COMPLETED, CANCELLED) |
| **Review** | Avis client (note 1-5 + commentaire) |
| **Conversation / Message** | Messagerie in-app (texte, image, vocal, fichier) |
| **Formation** | Formations en ligne avec modules et medias |
| **Notification** | Notifications en temps reel |
| **OtpSession** | Verification OTP par SMS |
| **RefreshToken** | Tokens de rafraichissement JWT |

---

## Fonctionnalites

- **Authentification** : inscription/connexion par telephone + OTP, mot de passe, refresh tokens
- **Recherche** : recherche de prestataires par categorie, quartier, mot-cle
- **Profil prestataire** : bio, photos, services multiples, avis, note moyenne
- **Reservation** : demande de reservation avec date, heure, note
- **Messagerie** : conversations client-prestataire avec texte, images, audio, fichiers PDF
- **Avis et notations** : systeme d'evaluation avec etoiles et commentaires
- **Formations** : creation et achat de formations en ligne (modules, videos, documents)
- **Notifications** : alertes pour reservations, avis, achats de formations
- **Panel admin** : gestion des prestataires, categories, utilisateurs, reservations, avis
- **Devenir prestataire** : processus d'inscription prestataire avec upload de photos
- **Upload fichiers** : stockage local en dev, Cloudflare R2 en production

---

## Guide d'installation

### Pre-requis

- **Node.js** 20+ ([telecharger](https://nodejs.org/))
- **Docker** ([telecharger](https://www.docker.com/products/docker-desktop/))
- **Git**

### 1. Cloner le projet

```bash
git clone https://github.com/mamadguirri/MOUSSO-CONNECT-PLATEFORME.git
cd MOUSSO-CONNECT-PLATEFORME
```

### 2. Lancer PostgreSQL avec Docker

```bash
docker run --name musso_postgres \
  -e POSTGRES_USER=musso \
  -e POSTGRES_PASSWORD=musso_dev_password \
  -e POSTGRES_DB=musso_connect \
  -p 5432:5432 \
  -d postgres:16-alpine
```

> Pour relancer le container apres un redemarrage : `docker start musso_postgres`

### 3. Installer les dependances

```bash
npm install
```

### 4. Configurer les variables d'environnement

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Les valeurs par defaut fonctionnent en dev, pas besoin de modifier.

### 5. Initialiser la base de donnees

```bash
npm run db:migrate
npm run db:seed
```

### 6. Lancer le projet

```bash
npm run dev
```

- **Frontend** : http://localhost:3000
- **API** : http://localhost:4000
- **Prisma Studio** : `npm run db:studio` (interface visuelle pour la BDD)

---

## Variables d'environnement

### API (`apps/api/.env`)

```env
# Base de donnees
DATABASE_URL="postgresql://musso:musso_dev_password@localhost:5432/musso_connect"

# JWT
JWT_SECRET="dev-secret-change-in-production"
JWT_REFRESH_SECRET="dev-refresh-secret-change-in-production"

# Serveur
PORT=4000
NODE_ENV=development
ALLOWED_ORIGIN="http://localhost:3000"

# Twilio SMS (optionnel en dev - les OTP s'affichent dans la console)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Cloudflare R2 (optionnel en dev - uploads sauvegardes localement)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=musso-connect
R2_PUBLIC_URL=
```

### Frontend (`apps/web/.env`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Scripts utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lancer API + frontend en mode developpement |
| `npm run dev:api` | Lancer uniquement l'API |
| `npm run dev:web` | Lancer uniquement le frontend |
| `npm run build` | Build de production (API + frontend) |
| `npm run db:migrate` | Appliquer les migrations Prisma |
| `npm run db:seed` | Peupler la base avec les donnees initiales |
| `npm run db:studio` | Ouvrir Prisma Studio (interface BDD) |

---

## API Endpoints

Base URL : `http://localhost:4000/api/v1`

| Methode | Route | Description |
|---------|-------|-------------|
| `POST` | `/auth/register` | Inscription |
| `POST` | `/auth/login` | Connexion |
| `POST` | `/auth/otp/send` | Envoyer un OTP |
| `POST` | `/auth/otp/verify` | Verifier un OTP |
| `GET` | `/providers` | Liste des prestataires |
| `GET` | `/providers/:id` | Detail d'une prestataire |
| `GET` | `/categories` | Liste des categories |
| `GET` | `/quartiers` | Liste des quartiers |
| `GET/POST` | `/bookings` | Reservations |
| `PATCH` | `/bookings/:id/status` | Changer le statut d'une reservation |
| `GET/POST` | `/messages` | Messagerie |
| `GET/POST` | `/reviews` | Avis et notations |
| `GET/POST` | `/formations` | Formations en ligne |
| `GET` | `/notifications` | Notifications |
| `GET/POST/PATCH` | `/admin/*` | Gestion admin |
| `GET` | `/health` | Health check (`/api/health`) |

> Toutes les routes protegees necessitent un header `Authorization: Bearer <token>`.

---

## Contribution

1. Creer une branche depuis `main` : `git checkout -b feat/ma-fonctionnalite`
2. Coder et tester localement
3. Commiter avec un message clair : `git commit -m "feat: description"`
4. Pousser et ouvrir une Pull Request : `git push origin feat/ma-fonctionnalite`

### Conventions de commits

- `feat:` nouvelle fonctionnalite
- `fix:` correction de bug
- `docs:` documentation
- `refactor:` refactoring

---

**Musso Connect** - Connecter les talents artisanaux de Bamako.
