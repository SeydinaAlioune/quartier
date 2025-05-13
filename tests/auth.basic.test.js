const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'setup/test.env') });

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/user.model');
const { connectDB, disconnectDB } = require('../src/config/database');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await connectDB(mongoUri);
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany();
    }
});

afterAll(async () => {
    await disconnectDB();
    if (mongoServer) {
        await mongoServer.stop();
    }
});

describe('Auth API Tests', () => {
    describe('POST /api/auth/register', () => {
        it('devrait créer un nouvel utilisateur', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            };

            const res = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user.email).toBe(userData.email);
            expect(res.body.user).not.toHaveProperty('password');
        });

        it('devrait refuser un email déjà utilisé', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            };

            await request(app)
                .post('/api/auth/register')
                .send(userData);

            const res = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('message');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Créer l'utilisateur via la route register pour s'assurer que le mot de passe est correctement hashé
            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                });
            console.log('Utilisateur créé:', registerResponse.body);

            // Vérifier l'utilisateur dans la base de données
            const user = await User.findOne({ email: 'test@example.com' });
            console.log('Utilisateur dans la base de données:', {
                id: user._id,
                email: user.email,
                password: user.password
            });
        });

        it('devrait connecter un utilisateur existant', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user).toHaveProperty('email', 'test@example.com');
            expect(res.body.user).not.toHaveProperty('password');
        });

        it('devrait refuser un mot de passe incorrect', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toBe(401);
            expect(res.body).toHaveProperty('message');
        });
    });
});
