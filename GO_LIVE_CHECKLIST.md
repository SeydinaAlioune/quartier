# Checklist Go-Live

## Sécurité

- [ ] `JWT_SECRET` fort (non par défaut)
- [ ] `CORS_ORIGINS` restreint au(x) domaine(s) front
- [ ] Helmet actif (déjà)
- [ ] Rate limiting actif (déjà)
- [ ] Variables clés non commitées (pas de `.env`)

## Base de données

- [ ] `MONGODB_URI` prod
- [ ] Index Mongo (si besoin) sur collections volumineuses (forum/posts/media)

## UX

- [ ] Smoke test visuel pages clés (Home, Auth, Forum, Annuaire, Services, Sécurité)
- [ ] Upload médias OK
- [ ] Liens “reset password” OK

## Observabilité (minimum)

- [ ] Logs accessibles sur l’hébergeur
- [ ] Alerting minimal (au moins erreurs 5xx)

## SEO

- [ ] Titres par page (déjà via useSeo)
- [ ] description cohérente

