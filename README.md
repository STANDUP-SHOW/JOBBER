# Jobber

Une marketplace de services à domicile : les clients publient un besoin
(ménage, bricolage, jardinage, garde d'enfants…), les prestataires postulent avec un tarif
horaire, le client accepte une offre, paie via un séquestre (escrow), puis peut noter le
prestataire une fois la mission terminée et payée.

> Projet pédagogique / point de départ technique.

## Architecture

```
jobber/
├── backend/     API REST (Express) + PostgreSQL (Prisma) + Socket.io + Stripe
└── frontend/    Application web (Next.js 14, App Router) + Tailwind CSS
```

**Stack :**
- **Backend** : Node.js, Express, Prisma ORM, PostgreSQL, JWT, Stripe (paiement en séquestre), Socket.io (messagerie temps réel), Zod (validation)
- **Frontend** : Next.js (App Router), React, Tailwind CSS, socket.io-client

**Modèle de données** (`backend/prisma/schema.prisma`) : `User`, `ProviderProfile`,
`Category`/`Service`, `Mission`, `Offer`, `Booking`, `Payment`, `Conversation`/`Message`,
`Review`, `VerificationDocument`.

## Fonctionnalités couvertes

| Fonctionnalité | Statut |
|---|---|
| Comptes client / prestataire | ✅ Auth JWT, inscription/connexion |
| Catégories & services (9 familles) | ✅ Ménage, bricolage, déménagement, jardinage, garde d'enfants, cours, aide à la personne, garde d'animaux, informatique |
| Publier une mission | ✅ |
| Postuler avec un tarif horaire libre | ✅ |
| Accepter une offre → réservation | ✅ |
| Paiement séquestré ("coffre-fort") | ✅ via Stripe PaymentIntent en capture manuelle |
| Versement au prestataire après validation | ✅ (simulation de wallet ; Stripe Connect à intégrer pour de vrais virements) |
| Messagerie temps réel client ↔ prestataire | ✅ Socket.io |
| Avis certifiés (uniquement après paiement) | ✅ |
| Vérification d'identité / KYC | ✅ Upload de documents + interface admin de validation (le contrôle documentaire humain reste manuel ; brancher une API tierce type Stripe Identity pour l'automatiser) |
| Back-office admin | ✅ Statistiques, file de vérification, gestion des catégories/services, liste des utilisateurs (`/admin`) |
| Frais de service (%) | ✅ configurable (`PLATFORM_FEE_PCT`, 20% par défaut) |
| Postulation automatique, heures sup, etc. | ⏳ non inclus (extensions possibles sur cette base) |

## Démarrage rapide

### 1. Base de données

```bash
docker compose up -d          # lance PostgreSQL sur localhost:5432
```

### 2. Backend

```bash
cd backend
cp .env.example .env          # renseignez au moins DATABASE_URL et JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run seed                  # crée les catégories + un compte admin
npm run dev                   # http://localhost:4000
```

Compte admin créé par le seed : `admin@jobber.local` / `ChangeMe123!` (à changer).

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                   # http://localhost:3000
```

### 4. Paiements (optionnel pour tester le flux complet)

Créez un compte [Stripe](https://dashboard.stripe.com) en mode test, récupérez vos clés
`sk_test_...` dans `backend/.env`, et utilisez une carte de test (`4242 4242 4242 4242`)
côté frontend une fois l'intégration Stripe Elements ajoutée à la page de réservation
(le backend expose déjà `POST /api/payments/:bookingId/create-intent`).

## Parcours type

1. Un client s'inscrit, publie une mission (`/missions/new`).
2. Des prestataires (comptes `PROVIDER`) postulent avec leur tarif (`/missions/:id`).
3. Le client accepte une offre → une `Booking` est créée avec un `Payment` en attente.
4. Le client autorise le paiement (séquestre), le prestataire réalise la mission,
   le client la valide (`/dashboard`) puis déclenche le versement.
5. Le client laisse un avis, visible sur le profil public du prestataire (`/providers/:id`).
6. Une conversation liée à la mission permet d'échanger en temps réel (`/messages`).

## Déploiement sur votre domaine

Voir [`DEPLOY.md`](./DEPLOY.md) pour la procédure complète (hébergement managé ou VPS,
DNS, HTTPS, configuration Stripe en production).

## À faire avant une mise en production

- **Paiements réels** : remplacer le wallet simulé par **Stripe Connect** (comptes
  connectés prestataires) pour de vrais virements, et gérer les remboursements partiels.
- **KYC** : brancher un prestataire de vérification d'identité (ex. Stripe Identity,
  Onfido) au lieu de l'upload manuel + validation admin.
- **Stockage fichiers** : brancher S3/Cloudinary pour les documents et avatars.
- **Notifications** : emails/SMS transactionnels (confirmation, rappel, litige).
- **Recherche géographique** : indexer `lat`/`lng` (PostGIS ou un service comme Algolia)
  pour le matching par zone d'intervention.
- **Modération & litiges** : file d'attente admin pour les avis/annulations contestés.
- **RGPD** : politique de conservation des données, export/suppression de compte.
- **Tests & CI** : le scaffold n'inclut pas encore de suite de tests automatisés.

## Licence

Code fourni à titre d'exemple technique, à adapter librement.
