
# QuartierConnect

Plateforme communautaire de quartier : actualités, forum, projets, services, annuaire, sécurité, galerie, dons.

## Points clés

- **Frontend**: React (Create React App) + React Router
- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **Sécurité**: CORS allowlist, rate limiting, validation d'inputs, Helmet
- **UX**: Auth centralisée (AuthContext), feedback via toasts, design tokens CSS
- **Emails**: Brevo (Sendinblue) comme provider principal (avec fallback selon configuration)

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
