const request = require('supertest');
const { app } = require('./index');
const pool = require('./services/pgClient');

afterAll(async () => {
    await pool.end();
});

describe('Static files', () => {
    test('GET / returns index.html', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toMatch(/html/);
    });

    test('GET /nonexistent returns 404', async () => {
        const res = await request(app).get('/nonexistent');
        expect(res.statusCode).toBe(404);
    });
});

describe('POST /api/user/register', () => {
    test('rejects missing fields', async () => {
        const res = await request(app)
            .post('/api/user/register')
            .send({ username: 'testuser' });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBeDefined();
    });
});

describe('POST /api/user/login', () => {
    test('rejects missing fields', async () => {
        const res = await request(app)
            .post('/api/user/login')
            .send({});
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBeDefined();
    });
    // credential validation requires a running PostgreSQL — covered by integration tests
});

describe('Protected routes require auth', () => {
    test('GET /api/chat/rooms returns 401 without token', async () => {
        const res = await request(app).get('/api/chat/rooms');
        expect(res.statusCode).toBe(401);
    });

    test('GET /api/chat/rooms/:roomId/messages returns 401 without token', async () => {
        const res = await request(app).get('/api/chat/rooms/general/messages');
        expect(res.statusCode).toBe(401);
    });

    test('POST /api/chat/message returns 401 without token', async () => {
        const res = await request(app)
            .post('/api/chat/message')
            .send({ roomId: 'general', message: 'hello' });
        expect(res.statusCode).toBe(401);
    });

    test('POST /api/chat/rooms returns 401 without token', async () => {
        const res = await request(app)
            .post('/api/chat/rooms')
            .send({ name: 'testroom' });
        expect(res.statusCode).toBe(401);
    });
});
