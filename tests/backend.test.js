const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../src/models/user.model');

let authToken;
let userId;

beforeAll(async () => {
    // Connexion à la base de données de test
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quartier-connect-test', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
});

afterAll(async () => {
    // Nettoyage de la base de données et déconnexion
    await User.deleteMany({});
    await mongoose.connection.close();
});

describe('Tests d\'authentification', () => {
    const testUser = {
        name: 'Test User',
        email: 'test@test.com',
        password: 'password123'
    };

    test('Inscription d\'un nouvel utilisateur', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send(testUser);
        
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('token');
        expect(response.body.user.email).toBe(testUser.email);
        userId = response.body.user.id;
    });

    test('Connexion utilisateur', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        authToken = response.body.token;
    });

    test('Récupération du profil', async () => {
        const response = await request(app)
            .get('/api/auth/profile')
            .set('Authorization', `Bearer ${authToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body.email).toBe(testUser.email);
    });
});

describe('Tests des posts', () => {
    const testPost = {
        title: 'Test Post',
        content: 'Contenu du test post',
        category: 'Général'
    };

    let postId;

    test('Création d\'un post', async () => {
        const response = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${authToken}`)
            .send(testPost);
        
        expect(response.status).toBe(201);
        expect(response.body.title).toBe(testPost.title);
        postId = response.body._id;
    });

    test('Récupération des posts', async () => {
        const response = await request(app)
            .get('/api/posts')
            .set('Authorization', `Bearer ${authToken}`);
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });
});

describe('Tests des événements', () => {
    const testEvent = {
        title: 'Test Event',
        description: 'Description de l\'événement test',
        date: new Date().toISOString(),
        location: 'Test Location'
    };

    let eventId;

    test('Création d\'un événement', async () => {
        const response = await request(app)
            .post('/api/events')
            .set('Authorization', `Bearer ${authToken}`)
            .send(testEvent);
        
        expect(response.status).toBe(201);
        expect(response.body.title).toBe(testEvent.title);
        eventId = response.body._id;
    });

    test('Récupération des événements', async () => {
        const response = await request(app)
            .get('/api/events')
            .set('Authorization', `Bearer ${authToken}`);
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });
});

describe('Tests des services', () => {
    const testService = {
        title: 'Test Service',
        description: 'Description du service test',
        category: 'Aide',
        price: 'Gratuit'
    };

    let serviceId;

    test('Création d\'un service', async () => {
        const response = await request(app)
            .post('/api/services')
            .set('Authorization', `Bearer ${authToken}`)
            .send(testService);
        
        expect(response.status).toBe(201);
        expect(response.body.title).toBe(testService.title);
        serviceId = response.body._id;
    });

    test('Récupération des services', async () => {
        const response = await request(app)
            .get('/api/services')
            .set('Authorization', `Bearer ${authToken}`);
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });
}); 