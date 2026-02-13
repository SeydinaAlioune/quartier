
# QuartierConnect

Plateforme communautaire de quartier : actualités, forum, projets, services, annuaire, sécurité, galerie, dons.

## Points clés

- **Frontend**: React (Create React App) + React Router
- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **Sécurité**: CORS allowlist, rate limiting, validation d'inputs, Helmet
- **UX**: Auth centralisée (AuthContext), feedback via toasts, design tokens CSS
- **Emails**: Brevo (Sendinblue) comme provider principal (avec fallback selon configuration)

## Stockage médias (Cloudinary)

Le backend supporte 2 modes de stockage pour les images/vidéos :

- **Local** (par défaut) : fichiers servis via `/uploads/...`
- **Cloudinary** (recommandé en production) : URLs persistantes `https://res.cloudinary.com/...`

Activation côté backend via variables d’environnement :

- `USE_CLOUDINARY=1`
- `CLOUDINARY_URL=cloudinary://...` (recommandé)
- (optionnel) `CLOUDINARY_FOLDER=quartier`

Comportement :

- À l’upload : si `USE_CLOUDINARY=1` et credentials présents, le fichier est uploadé sur Cloudinary et l’URL Cloudinary est stockée en base.
- À la suppression (dans l’app) : si le média est stocké sur Cloudinary, l’asset Cloudinary est supprimé (libère l’espace) puis l’enregistrement est supprimé.

## Notifications Admin

- **Cloche globale** dans le header Admin (unread count + liste des derniers éléments)
- **Page dédiée**: `/admin/notifications`
  - Liste des notifications non lues
  - Actions: marquer comme lu (par item) + tout marquer comme lu
- **Triggers backend** (création de notifications admin):
  - Contact messages
  - Signalements sécurité
  - Forum: annonce en attente + signalement forum
  - Projets: soumission de projet (proposition)
  - Dons: don complété

## Démarrage rapide

### Backend

```bash
npm install
cp .env.example .env
npm run dev
```

### Frontend

```bash
cd client
npm install
cp .env.example .env
npm start
```

## Documentation

- `README.PROJECT.md`: setup détaillé
- `DEPLOYMENT.md`: déploiement Cloudflare Pages + backend
- `GO_LIVE_CHECKLIST.md`: checklist mise en prod

## Configuration (env)

- Backend : `.env.example`
- Frontend : `client/.env.example`

## Tests

Backend:

```bash
npm test
```

Frontend:

```bash
cd client
npm run build
```
