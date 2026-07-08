# Déployer Jobber sur votre domaine (ex. jobber.com)

Ce guide couvre deux façons de mettre l'application en ligne : la voie **simple** (services
managés, recommandée pour démarrer) et la voie **VPS** (un seul serveur, plus de contrôle).

Dans les deux cas, l'application a besoin de **trois éléments séparés** :
1. Une base de données PostgreSQL
2. Le backend (API Node.js + Socket.io) — ex. `api.jobber.com`
3. Le frontend (Next.js) — ex. `jobber.com`

---

## Option A — Hébergement managé (le plus simple)

**Base de données : [Railway](https://railway.app) ou [Neon](https://neon.tech)**
1. Créez un projet PostgreSQL. Copiez l'URL de connexion (`DATABASE_URL`).

**Backend : [Railway](https://railway.app) ou [Render](https://render.com)**
1. Créez un nouveau service à partir du dossier `backend/`.
2. Build command : `npm install && npx prisma generate`
   Start command : `npx prisma migrate deploy && node src/server.js`
3. Variables d'environnement à renseigner (voir `backend/.env.example`) :
   - `DATABASE_URL` (celle de l'étape précédente)
   - `JWT_SECRET` (générez une chaîne aléatoire longue, ex. `openssl rand -hex 32`)
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (clés **live** depuis le dashboard Stripe)
   - `CLIENT_ORIGIN=https://jobber.com`
   - `PORT` (généralement fourni automatiquement par l'hébergeur)
4. Une fois déployé, exécutez une fois (console/CLI de l'hébergeur) :
   ```bash
   npx prisma migrate deploy
   npm run seed
   ```
5. Notez l'URL publique donnée par l'hébergeur (ex. `https://jobber-api.up.railway.app`).

**Frontend : [Vercel](https://vercel.com)**
1. Importez le dossier `frontend/` comme projet Vercel.
2. Variable d'environnement : `NEXT_PUBLIC_API_URL=https://api.jobber.com` (ou l'URL notée ci-dessus).
3. Déployez.

**Domaine**
1. Dans Vercel → Domaines, ajoutez `jobber.com` et `www.jobber.com`. Vercel vous donne les
   enregistrements DNS à créer chez votre registrar (A/CNAME).
2. Dans votre hébergeur backend, ajoutez un sous-domaine `api.jobber.com` pointant vers le
   service (CNAME fourni par l'hébergeur).
3. Le SSL (HTTPS) est généré automatiquement par Vercel/Railway/Render, aucune action requise.

**Stripe**
1. Dashboard Stripe → Webhooks → ajouter un endpoint : `https://api.jobber.com/api/payments/webhook`.
2. Sélectionnez au moins l'événement `payment_intent.payment_failed`.
3. Copiez le secret de signature généré dans `STRIPE_WEBHOOK_SECRET`.

➡️ Coût approximatif pour démarrer : gratuit à ~20 €/mois selon le trafic.

---

## Option B — Un seul VPS (ex. OVH, Hetzner, DigitalOcean)

Convient si vous préférez tout gérer vous-même sur un seul serveur Ubuntu.

1. **Provisionnez un VPS** (2 Go de RAM minimum), pointez `jobber.com` et `api.jobber.com`
   vers son IP (enregistrements DNS de type A chez votre registrar).

2. **Installez les dépendances** sur le serveur :
   ```bash
   sudo apt update && sudo apt install -y nodejs npm nginx certbot python3-certbot-nginx
   sudo apt install -y postgresql
   ```

3. **Base de données** :
   ```bash
   sudo -u postgres createuser jobber
   sudo -u postgres createdb jobber -O jobber
   sudo -u postgres psql -c "ALTER USER jobber PASSWORD 'un-mot-de-passe-fort';"
   ```
   → `DATABASE_URL="postgresql://jobber:un-mot-de-passe-fort@localhost:5432/jobber"`

4. **Déployez le code** (via `git clone` de votre dépôt, ou `scp` du zip) dans `/var/www/jobber`.

5. **Backend** :
   ```bash
   cd /var/www/jobber/backend
   cp .env.example .env   # remplissez DATABASE_URL, JWT_SECRET, clés Stripe, CLIENT_ORIGIN
   npm install
   npx prisma migrate deploy
   npm run seed
   npm install -g pm2
   pm2 start src/server.js --name jobber-api
   pm2 save && pm2 startup
   ```

6. **Frontend** :
   ```bash
   cd /var/www/jobber/frontend
   cp .env.example .env.local   # NEXT_PUBLIC_API_URL=https://api.jobber.com
   npm install
   npm run build
   pm2 start npm --name jobber-web -- start
   ```

7. **Nginx** — reverse proxy pour les deux domaines (fichiers dans `/etc/nginx/sites-available/`) :
   ```nginx
   server {
     server_name jobber.com www.jobber.com;
     location / { proxy_pass http://localhost:3000; proxy_set_header Host $host; }
   }
   server {
     server_name api.jobber.com;
     location / {
       proxy_pass http://localhost:4000;
       proxy_set_header Host $host;
       proxy_set_header Upgrade $http_upgrade;   # requis pour Socket.io
       proxy_set_header Connection "upgrade";
     }
   }
   ```
   Activez les sites (`ln -s` vers `sites-enabled`), puis `sudo nginx -t && sudo systemctl reload nginx`.

8. **HTTPS** :
   ```bash
   sudo certbot --nginx -d jobber.com -d www.jobber.com -d api.jobber.com
   ```

---

## Après le déploiement

- **Compte admin** : le script `npm run seed` crée automatiquement un compte
  `admin@jobber.local` / `ChangeMe123!` avec le rôle `ADMIN`. **Changez ce mot de passe
  immédiatement** (via `/api/auth/login` puis une mise à jour directe en base, il n'y a pas
  encore d'écran "changer mon mot de passe" — à ajouter si besoin).
- **Back-office** : une fois connecté avec ce compte admin, l'onglet **Back-office** apparaît
  dans le menu (`jobber.com/admin`) : statistiques, file de vérification des prestataires,
  gestion des catégories, liste des utilisateurs.
- **Promouvoir un autre utilisateur en admin** : pas d'interface prévue pour ça (par sécurité).
  Passez par Prisma Studio (`npx prisma studio` sur le backend) ou une requête SQL directe :
  `UPDATE "User" SET role = 'ADMIN' WHERE email = '...';`
- **Sauvegardes** : configurez des sauvegardes automatiques de la base PostgreSQL (les
  hébergeurs managés le proposent en un clic ; sur VPS, planifiez `pg_dump` via cron).
