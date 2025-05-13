const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'setup/test.env') });

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/user.model');
const Post = require('../src/models/post.model');
const Event = require('../src/models/event.model');
const { connectDB, disconnectDB } = require('../src/config/database');
const bcrypt = require('bcryptjs');

let mongoServer;
let testUser;
let adminUser;
let authToken;
let adminToken;

beforeAll(async () => {
    // Démarrer le serveur MongoDB en mémoire
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = await mongoServer.getUri();
    
    // Connexion à la base de données de test
    await connectDB(mongoUri);
});

afterAll(async () => {
    await disconnectDB();
    await mongoServer.stop();
});

beforeEach(async () => {
    // Nettoyer les collections avant chaque test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany();
    }

    // Créer un utilisateur de test
    const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'testpassword'
    };

    const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

    testUser = res.body.user;
    authToken = res.body.token;

    // Créer un utilisateur admin
    const adminData = {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'adminpassword',
        role: 'admin'
    };

    const adminRes = await request(app)
        .post('/api/auth/register')
        .send(adminData);

    adminUser = adminRes.body.user;
    adminToken = adminRes.body.token;
});

describe('Tests QuartierConnect', () => {
    // 1. Tests d'Authentification
    describe('Authentication', () => {
        describe('POST /api/auth/register', () => {
            it('devrait créer un nouvel utilisateur', async () => {
                const userData = {
                    name: 'New User',
                    email: 'new@example.com',
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

                const res = await request(app)
                    .post('/api/auth/register')
                    .send(userData);

                expect(res.statusCode).toBe(400);
                expect(res.body).toHaveProperty('message');
            });
        });

        describe('POST /api/auth/login', () => {
            it('devrait connecter un utilisateur existant', async () => {
                const res = await request(app)
                    .post('/api/auth/login')
                    .send({
                        email: 'test@example.com',
                        password: 'testpassword'
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

    // 2. Tests de Gestion des Utilisateurs
    describe('User Management', () => {
        describe('GET /api/users/profile', () => {
            it('devrait récupérer le profil utilisateur', async () => {
                const res = await request(app)
                    .get('/api/users/profile')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.statusCode).toBe(200);
                expect(res.body).toHaveProperty('email', 'test@example.com');
                expect(res.body).not.toHaveProperty('password');
            });

            it('devrait refuser l\'accès sans token', async () => {
                const res = await request(app)
                    .get('/api/users/profile');

                expect(res.statusCode).toBe(401);
            });
        });

        describe('PUT /api/users/profile', () => {
            it('devrait mettre à jour le profil utilisateur', async () => {
                const updateData = {
                    name: 'Updated Name'
                };

                const res = await request(app)
                    .put('/api/users/profile')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(updateData);

                expect(res.statusCode).toBe(200);
                expect(res.body.name).toBe(updateData.name);
            });
        });
    });

    // 3. Tests de Gestion des Posts
    describe('Post Management', () => {
        let createdPost;

        describe('POST /api/posts', () => {
            it('devrait créer un nouveau post', async () => {
                const postData = {
                    title: 'Test Post',
                    content: 'Test Content'
                };

                const res = await request(app)
                    .post('/api/posts')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(postData);

                expect(res.statusCode).toBe(201);
                expect(res.body).toHaveProperty('title', postData.title);
                expect(res.body.author._id.toString()).toBe(testUser.id.toString());
                createdPost = res.body;
            });
        });

        describe('GET /api/posts', () => {
            it('devrait récupérer tous les posts', async () => {
                // Créer d'abord un post
                const postData = {
                    title: 'Test Post',
                    content: 'Test Content'
                };

                const createRes = await request(app)
                    .post('/api/posts')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(postData);

                createdPost = createRes.body;

                const res = await request(app)
                    .get('/api/posts')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.statusCode).toBe(200);
                expect(Array.isArray(res.body)).toBe(true);
                expect(res.body.length).toBeGreaterThan(0);
                expect(res.body[0]).toHaveProperty('_id');
            });
        });

        describe('GET /api/posts/:id', () => {
            it('devrait récupérer un post spécifique', async () => {
                // Créer d'abord un post
                const postData = {
                    title: 'Test Post',
                    content: 'Test Content'
                };

                const createRes = await request(app)
                    .post('/api/posts')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(postData);

                createdPost = createRes.body;

                const res = await request(app)
                    .get(`/api/posts/${createdPost._id}`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.statusCode).toBe(200);
                expect(res.body).toHaveProperty('_id', createdPost._id);
                expect(res.body.author._id.toString()).toBe(testUser.id.toString());
            });
        });

        describe('PUT /api/posts/:id', () => {
            it('devrait mettre à jour un post', async () => {
                // Créer d'abord un post
                const postData = {
                    title: 'Test Post',
                    content: 'Test Content'
                };

                const createRes = await request(app)
                    .post('/api/posts')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(postData);

                createdPost = createRes.body;

                const updateData = {
                    title: 'Updated Post',
                    content: 'Updated Content'
                };

                const res = await request(app)
                    .put(`/api/posts/${createdPost._id}`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(updateData);

                expect(res.statusCode).toBe(200);
                expect(res.body).toHaveProperty('title', updateData.title);
                expect(res.body.author._id.toString()).toBe(testUser.id.toString());
            });
        });
    });

    // 4. Tests de Gestion des Événements
    describe('Event Management', () => {
        let createdEvent;

        describe('POST /api/events', () => {
            it('devrait créer un nouvel événement', async () => {
                const eventData = {
                    title: 'Test Event',
                    description: 'Test Description',
                    date: new Date().toISOString(),
                    location: 'Test Location'
                };

                const res = await request(app)
                    .post('/api/events')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(eventData);

                expect(res.statusCode).toBe(201);
                expect(res.body).toHaveProperty('title', eventData.title);
                expect(res.body.organizer._id.toString()).toBe(testUser.id.toString());
                createdEvent = res.body;
            });
        });

        describe('GET /api/events', () => {
            it('devrait récupérer tous les événements', async () => {
                // Créer d'abord un événement
                const eventData = {
                    title: 'Test Event',
                    description: 'Test Description',
                    date: new Date().toISOString(),
                    location: 'Test Location'
                };

                const createRes = await request(app)
                    .post('/api/events')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(eventData);

                createdEvent = createRes.body;

                const res = await request(app)
                    .get('/api/events')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.statusCode).toBe(200);
                expect(Array.isArray(res.body)).toBe(true);
                expect(res.body.length).toBeGreaterThan(0);
                expect(res.body[0]).toHaveProperty('_id');
            });
        });

        describe('GET /api/events/:id', () => {
            it('devrait récupérer un événement spécifique', async () => {
                // Créer d'abord un événement
                const eventData = {
                    title: 'Test Event',
                    description: 'Test Description',
                    date: new Date().toISOString(),
                    location: 'Test Location'
                };

                const createRes = await request(app)
                    .post('/api/events')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(eventData);

                createdEvent = createRes.body;

                const res = await request(app)
                    .get(`/api/events/${createdEvent._id}`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.statusCode).toBe(200);
                expect(res.body).toHaveProperty('_id', createdEvent._id);
                expect(res.body.organizer._id.toString()).toBe(testUser.id.toString());
            });
        });

        describe('PUT /api/events/:id', () => {
            it('devrait mettre à jour un événement', async () => {
                // Créer d'abord un événement
                const eventData = {
                    title: 'Test Event',
                    description: 'Test Description',
                    date: new Date().toISOString(),
                    location: 'Test Location'
                };

                const createRes = await request(app)
                    .post('/api/events')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(eventData);

                createdEvent = createRes.body;

                const updateData = {
                    title: 'Updated Event',
                    description: 'Updated Description',
                    date: new Date().toISOString(),
                    location: 'Updated Location'
                };

                const res = await request(app)
                    .put(`/api/events/${createdEvent._id}`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(updateData);

                expect(res.statusCode).toBe(200);
                expect(res.body).toHaveProperty('title', updateData.title);
                expect(res.body.organizer._id.toString()).toBe(testUser.id.toString());
            });
        });

        describe('POST /api/events/:id/join', () => {
            it('devrait permettre de participer à un événement', async () => {
                // Créer d'abord un événement
                const eventData = {
                    title: 'Test Event',
                    description: 'Test Description',
                    date: new Date().toISOString(),
                    location: 'Test Location'
                };

                const createRes = await request(app)
                    .post('/api/events')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(eventData);

                createdEvent = createRes.body;

                const res = await request(app)
                    .post(`/api/events/${createdEvent._id}/join`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.statusCode).toBe(200);
                expect(res.body.participants).toContainEqual(expect.objectContaining({
                    _id: testUser.id
                }));
            });

            it('devrait empêcher de participer deux fois au même événement', async () => {
                // Créer d'abord un événement
                const eventData = {
                    title: 'Test Event',
                    description: 'Test Description',
                    date: new Date().toISOString(),
                    location: 'Test Location'
                };

                const createRes = await request(app)
                    .post('/api/events')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(eventData);

                createdEvent = createRes.body;

                // Première participation
                await request(app)
                    .post(`/api/events/${createdEvent._id}/join`)
                    .set('Authorization', `Bearer ${authToken}`);

                // Deuxième tentative
                const res = await request(app)
                    .post(`/api/events/${createdEvent._id}/join`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.statusCode).toBe(400);
            });
        });
    });

    // 5. Tests Admin
    describe('Admin Features', () => {
        describe('GET /api/admin/users', () => {
            it('devrait permettre à l\'admin de voir tous les utilisateurs', async () => {
                const res = await request(app)
                    .get('/api/admin/users')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(res.statusCode).toBe(200);
                expect(Array.isArray(res.body)).toBeTruthy();
            });

            it('devrait refuser l\'accès aux utilisateurs non admin', async () => {
                const res = await request(app)
                    .get('/api/admin/users')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.statusCode).toBe(403);
            });
        });
    });
});
