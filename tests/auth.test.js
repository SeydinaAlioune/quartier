const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user.model');
const jwt = require('jsonwebtoken');

describe('Authentication Tests', () => {
    let user;
    let admin;
    let userToken;
    let adminToken;

    beforeEach(async () => {
        // Créer un utilisateur normal
        user = await User.create({
            name: 'Test User',
            email: 'user@test.com',
            password: 'password123',
            role: 'user'
        });

        // Créer un admin
        admin = await User.create({
            name: 'Test Admin',
            email: 'admin@test.com',
            password: 'admin123',
            role: 'admin'
        });

        // Générer les tokens
        userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);
    });

    describe('POST /api/auth/login', () => {
        it('devrait connecter un utilisateur avec des identifiants valides', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'user@test.com',
                    password: 'password123'
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user).toHaveProperty('role', 'user');
        });

        it('devrait connecter un admin avec des identifiants valides', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@test.com',
                    password: 'admin123'
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user).toHaveProperty('role', 'admin');
        });

        it('devrait refuser une connexion avec un mot de passe incorrect', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'user@test.com',
                    password: 'wrongpassword'
                });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/auth/profile', () => {
        it('devrait récupérer le profil utilisateur avec un token valide', async () => {
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('email', 'user@test.com');
        });

        it('devrait refuser l\'accès sans token', async () => {
            const res = await request(app)
                .get('/api/auth/profile');

            expect(res.status).toBe(401);
        });
    });
});
