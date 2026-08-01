# Déployer LibertineConnect en ligne

Trois briques à héberger séparément : une base PostgreSQL, le backend
(Express + Socket.io), et le frontend (Next.js). Ce guide utilise des offres
gratuites pour démarrer — suffisant pour tester le site en vrai, pas pour
une mise en production avec de vrais utilisateurs (voir le README, section
"À faire avant toute mise en production").

Le code est déjà sur GitHub : dépôt `STANDUP-SHOW/JOBBER`, branche
`claude/escort-listings-platform-fr-lpya3t`, dossier `libertine-app/`.

---

## 1. Base de données — [Neon](https://neon.tech) (gratuit)

1. Créez un compte, puis **New Project** → nommez-le `libertine`.
2. Copiez la **Connection string** (commence par `postgresql://...`) — vous
   en aurez besoin à l'étape 2.

## 2. Backend — [Render](https://render.com) (gratuit)

1. **New** → **Web Service** → connectez votre compte GitHub → sélectionnez
   le dépôt `STANDUP-SHOW/JOBBER`, branche `claude/escort-listings-platform-fr-lpya3t`.
2. **Root Directory** : `libertine-app/backend`
3. **Build Command** : `npm install && npx prisma generate`
4. **Start Command** : `npx prisma migrate deploy && node src/server.js`
5. **Environment Variables** :
   - `DATABASE_URL` → la connection string Neon de l'étape 1
   - `JWT_SECRET` → une chaîne aléatoire longue et unique, générée par
     exemple avec `openssl rand -hex 32` (dans un terminal local) — ne
     réutilisez jamais un secret partagé ou trouvé ailleurs.
   - `MIN_AGE` → `18`
   - `UPLOAD_DIR` → `./uploads`
   - `CORS_ORIGIN` → laissez temporairement `http://localhost:3100`, vous le
     corrigerez à l'étape 4 une fois l'URL Vercel connue
   - Ne définissez pas `PORT` manuellement — Render le fournit automatiquement.
6. **Deploy**. Une fois en ligne, notez l'URL publique donnée par Render
   (ex. `https://libertine-api.onrender.com`).
7. Ouvrez le **Shell** Render du service (onglet "Shell") et exécutez une
   fois : `npm run seed` → crée le compte admin `admin@libertine.local` /
   `ChangeMe123!` (à changer après votre première connexion).

## 3. Frontend — [Vercel](https://vercel.com) (gratuit)

1. **Add New** → **Project** → importez le même dépôt GitHub, même branche.
2. **Root Directory** : `libertine-app/frontend`
3. **Environment Variable** : `NEXT_PUBLIC_API_URL` → l'URL Render de
   l'étape 2 (ex. `https://libertine-api.onrender.com`)
4. **Deploy**. Vercel vous donne une URL publique, ex.
   `https://libertine-connect.vercel.app` — **c'est votre lien à partager**.

## 4. Finir le câblage

1. Retournez dans Render → variables d'environnement du backend → mettez à
   jour `CORS_ORIGIN` avec l'URL Vercel obtenue à l'étape 3 → redéployez.
2. Ouvrez votre URL Vercel dans un navigateur : le site est en ligne.

---

## À savoir sur les offres gratuites

- **Render free tier** : le service backend s'endort après une période
  d'inactivité — le premier chargement après une pause peut prendre 30 à 60
  secondes ("cold start"). Suivant.
- **Disque éphémère** : les photos uploadées (`UPLOAD_DIR`) sont perdues à
  chaque redéploiement/redémarrage sur le tier gratuit de Render — c'est le
  même point déjà noté dans le README (à remplacer par un bucket S3 avant
  toute utilisation réelle).
- Ce reste un **MVP de démonstration** : la checklist "à faire avant mise en
  production" du README (vérification d'âge renforcée, modération de
  contenu automatisée, conformité RGPD) s'applique toujours avant d'inviter
  de vrais utilisateurs.
