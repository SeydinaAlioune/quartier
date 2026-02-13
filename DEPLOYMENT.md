# Déploiement (Cloudflare Pages + Backend)

Ce guide décrit un déploiement simple et robuste :

- Frontend (React CRA) sur Cloudflare Pages
- Backend (Node/Express) sur un hébergeur Node (Render, VPS, etc.)

## 1) Backend

### Variables d'environnement

Copie `.env.example` vers `.env` et renseigne au minimum :

- `MONGODB_URI`
- `JWT_SECRET`
- `CORS_ORIGINS` (inclure le domaine Pages)
- `FRONTEND_URL` (domaine Pages)

#### Stockage médias (Cloudinary)

En production, il est recommandé d’utiliser Cloudinary (stockage persistant) pour éviter la disparition des médias sur des disques éphémères.

Variables backend :

- `USE_CLOUDINARY=1`
- `CLOUDINARY_URL=cloudinary://...`
- (optionnel) `CLOUDINARY_FOLDER=quartier`

Notes :

- `CLOUDINARY_URL` doit être la valeur brute qui commence par `cloudinary://` (ne pas inclure `CLOUDINARY_URL=` dans la valeur).
- Après changement de variables, redeployer le backend.

### Démarrage

- Dev : `npm run dev`
- Prod : `npm start`

### CORS

Exemple :

```
CORS_ORIGINS=https://quartier-b3o.pages.dev
```

Si tu veux autoriser plusieurs origines, sépare par virgules.

### Healthcheck

Recommandé : exposer une route healthcheck (si ton hébergeur le demande). Si non présent, se baser sur un endpoint existant `GET /api/...`.

## 2) Frontend (Cloudflare Pages)

### Build settings

- **Framework preset** : Create React App
- **Build command** : `npm run build`
- **Build output directory** : `client/build`

> Si Cloudflare Pages build à la racine du repo, configure le build pour pointer vers `client`.

### Variables d'environnement

Sur Cloudflare Pages (Build settings), définir :

- `REACT_APP_API_URL` :
  - soit l’URL complète du backend (ex: `https://api.example.com`)
  - soit vide si tu as un proxy same-origin (plus rare sur Pages)

Notes :

- Pour les médias Cloudinary, le client doit accepter des URLs absolues `https://res.cloudinary.com/...` (ne pas préfixer avec le domaine backend).

### Appels API

Le client utilise `REACT_APP_API_URL` si défini. En prod, si `REACT_APP_API_URL` est vide, le client utilisera le même domaine (same-origin). Assure-toi donc que ton infra route `/api` vers ton backend, sinon mets `REACT_APP_API_URL`.

## 3) Checklist post-déploiement

- Tester : login/register
- Tester : forum (create topic + reply)
- Tester : annonces (création + upload image)
- Vérifier CORS : pas d’erreur console
- Vérifier emails (si activés)
