const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user.model');
const Post = require('../src/models/post.model');
const Event = require('../src/models/event.model');
const jwt = require('jsonwebtoken');

describe('Admin Routes Tests', () => {
    let admin;
    let user;
    let adminToken;
    let userToken;

    beforeEach(async () => {
        // Créer un admin et un utilisateur normal
        admin = await User.create({
            name: 'Test Admin',
            email: 'admin@test.com',
            password: 'admin123',
            role: 'admin'
        });

        user = await User.create({
            name: 'Test User',
            email: 'user@test.com',
            password: 'password123',
            role: 'user'
        });

        // Créer quelques données de test
        await Post.create({
            title: 'Test Post',
            content: 'Test Content',
            author: user._id
        });

        await Event.create({
            title: 'Test Event',
            description: 'Test Description',
            date: new Date(),
            organizer: user._id
        });

        // Générer les tokens
        adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);
        userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    });

    describe('GET /api/admin/dashboard', () => {
        it('devrait permettre à l\'admin d\'accéder au dashboard', async () => {
            const res = await request(app)
                .get('/api/admin/dashboard')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('users');
            expect(res.body).toHaveProperty('content');
            expect(res.body).toHaveProperty('activity');
        });

        it('devrait refuser l\'accès à un utilisateur normal', async () => {
            const res = await request(app)
                .get('/api/admin/dashboard')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/admin/users', () => {
        it('devrait permettre à l\'admin de voir la liste des utilisateurs', async () => {
            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
        });
    });

    describe('PUT /api/admin/users/:id/role', () => {
        it('devrait permettre à l\'admin de modifier le rôle d\'un utilisateur', async () => {
            const res = await request(app)
                .put(`/api/admin/users/${user._id}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ role: 'moderator' });

            expect(res.status).toBe(200);
            expect(res.body.role).toBe('moderator');
        });
    });

    describe('GET /api/admin/content', () => {
        it('devrait récupérer le contenu à modérer', async () => {
            const res = await request(app)
                .get('/api/admin/content')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('posts');
            expect(res.body).toHaveProperty('events');
        });
    });

    describe('GET /api/admin/security/reports', () => {
        it('devrait récupérer les rapports de sécurité', async () => {
            const res = await request(app)
                .get('/api/admin/security/reports')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('reportedContent');
            expect(res.body).toHaveProperty('securityAlerts');
        });
    });

    describe('GET /api/admin/analytics', () => {
        it('devrait récupérer les analytics', async () => {
            const res = await request(app)
                .get('/api/admin/analytics')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('userGrowth');
            expect(res.body).toHaveProperty('contentEngagement');
            expect(res.body).toHaveProperty('eventParticipation');
        });
    });

    describe('GET /api/admin/media', () => {
        it('devrait récupérer la gestion des médias', async () => {
            const res = await request(app)
                .get('/api/admin/media')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('media');
            expect(res.body).toHaveProperty('stats');
        });
    });
});
