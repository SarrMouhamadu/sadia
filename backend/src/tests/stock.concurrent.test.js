const request = require('supertest');
const { sequelize, User, Product } = require('../models');
const { generateAccessToken } = require('../middlewares/auth');

// Import app (server.js exports app)
const app = require('../server');

describe('Concurrent stock exit', () => {
    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        // Recreate schema for test isolation
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    test('two concurrent exits should not allow negative stock', async () => {
        // Create admin user
        const user = await User.create({
            nom: 'Test',
            prenom: 'Admin',
            email: 'admin@test.local',
            password: 'password',
            role: 'ADMIN'
        });

        const token = generateAccessToken(user);

        // Create product with quantity 10
        const product = await Product.create({
            nom: 'Concurrent Product',
            quantite_actuelle: 10,
            seuil_alerte: 2
        });

        const payload = (qty) => ({ product_id: product.id, quantite: qty, destination: 'Site A' });

        // Fire two requests concurrently that together exceed available stock
        const req1 = request(app)
            .post('/api/stock/exit')
            .set('Authorization', `Bearer ${token}`)
            .send(payload(7));

        const req2 = request(app)
            .post('/api/stock/exit')
            .set('Authorization', `Bearer ${token}`)
            .send(payload(7));

        const results = await Promise.allSettled([req1, req2]);

        const statuses = results.map(r => (r.status === 'fulfilled' ? r.value.status : 500));

        // Expect one to succeed (201) and the other to fail with 400 (insufficient quantity)
        expect(statuses).toContain(201);
        expect(statuses).toContain(400);
    }, 20000);
});
