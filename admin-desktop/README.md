# Jobber Admin Factory

Application de bureau (Windows, macOS sur demande) qui sert de back-office administrateur à JobberPlus.
Elle parle uniquement à l'API `/api/admin/v1` du backend, réservée aux comptes `ADMIN`.

## Installer

1. GitHub → onglet **Actions** → workflow **Jobber Admin Factory (installeur)** → dernière exécution réussie.
2. En bas de la page, section **Artifacts** : télécharger `Jobber-Admin-Factory-Windows` (un zip contenant le `.exe`).
3. Lancer `Jobber-Admin-Factory-Setup-x.y.z.exe`. L'installeur n'étant pas signé, Windows SmartScreen affiche
   « Windows a protégé votre ordinateur » : cliquer sur **Informations complémentaires** puis **Exécuter quand même**.
4. Se connecter avec l'email et le mot de passe d'un compte administrateur Jobber.

Pour macOS : lancer le workflow à la main (« Run workflow ») en cochant « Construire aussi la version macOS ».

L'application est installée pour l'utilisateur Windows courant uniquement. La session est chiffrée avec le
coffre du système (DPAPI) ; le jeton n'est jamais exposé à l'interface.

## Base de données

L'API admin utilise 4 tables (`AdminAccess`, `AuditEvent`, `AdminNote`, `AccountRestriction`) sans modifier les
tables existantes. Le backend les crée lui-même au démarrage si elles manquent (`backend/src/admin/ensureSchema.js`) :
aucune commande à lancer sur Railway. Si la création échoue, les journaux Railway affichent
« Admin schema bootstrap failed » et suspensions, notes internes, journal d'audit et rôles répondent « migration requise ».

## Développer

```bash
cd admin-desktop
npm install
npm start            # ouvre l'application
npm run dist:win     # installeur Windows (à lancer sous Windows)
```

Sur l'écran de connexion, « Serveur » permet de viser un backend local (`http://localhost:4000`).

## Ce qui est construit (lot 1 du cahier des charges)

| Pôle | Écrans |
|---|---|
| 01 Dashboard | Cockpit (KPI calculés sur la base, définitions affichées), file des actions, indicateurs non branchés marqués « indisponible » |
| 02 Utilisateurs | Liste par segment, fiche 360, modification avec contrôle de version, suspension/réactivation, vérifications documentaires |
| 03 Missions | Missions (démo masquées par défaut), fiche avec chronologie, devis/offres, commandes, annulation d'une mission sans commande |
| 04 Entreprises | Entreprises clientes, corporate et agences (volume, marge, revenu JobberPlus) |
| 05 SAV | Boîte « Nous contacter », litiges, avis, lecture motivée des conversations privées |
| 06 Finance | Transactions (lecture seule, ventilation), versements |
| 13 Administration | Administrateurs, rôles et permissions, journal d'audit, paramètres |

Pôles 07 à 12 : visibles dans le menu, marqués avec leur lot, sans donnée tant qu'ils ne sont pas branchés.

Règles appliquées partout : droits revérifiés par le serveur, motif obligatoire et trace d'audit sur chaque action,
montants en centimes avec devise, dates affichées en heure de Paris, exports CSV protégés contre les formules.
