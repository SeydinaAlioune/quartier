# QuartierConnect

Plateforme communautaire de quartier (actus, projets, services, annuaire, sécurité, forum, galerie, dons).

## Stack

- Backend: Node.js + Express + MongoDB (Mongoose)
- Frontend: React (Create React App) + React Router

## Prérequis

- Node.js
- MongoDB (local) ou un URI MongoDB distant

## Installation

### 1) Backend

```bash
npm install
```

Créer un fichier `.env` à partir de `.env.example`.

Lancer le serveur:

```bash
npm run dev
```

Le backend écoute par défaut sur `http://localhost:5000`.

### 2) Frontend

```bash
cd client
npm install
```

Créer `client/.env` à partir de `client/.env.example`.

Lancer le client:

```bash
npm start
```

Le frontend écoute par défaut sur `http://localhost:3000`.

## Variables d'environnement (résumé)

### Backend (`.env`)

- `MONGODB_URI`: connexion Mongo
- `JWT_SECRET`: secret JWT
- `CORS_ORIGINS`: allowlist CORS (séparée par virgules)
- `FRONTEND_URL`: utilisé pour les liens email (reset password)
- `RESEND_API_KEY`, `FROM_EMAIL`: emails (optionnel)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`: seed admin (optionnel)

### Frontend (`client/.env`)

- `REACT_APP_API_URL`: base URL API en dev local

## Sécurité (notes prod)

- CORS est restreint par allowlist (`CORS_ORIGINS`).
- Rate limiting en mémoire: adapté à une prod **1 instance**.
- Helmet activé (headers de sécurité). 

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

## Déploiement

- Frontend: Cloudflare Pages (ex: `https://quartier-b3o.pages.dev`)
- Backend: hébergement Node (Render, VPS, etc.)

Assure-toi que `CORS_ORIGINS` contient le domaine Pages en prod.
