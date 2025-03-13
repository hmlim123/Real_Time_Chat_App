const request = require('supertest');
const { app, startServer, stopServer } = require('./index'); // Import `startServer` and `stopServer`

describe('Express Static File Tests', () => {
    let server; // Declare server variable

    // ✅ Start the server before tests
    beforeAll((done) => {
        server = startServer();
        done();
    });

    // ✅ Close the server after tests
    afterAll((done) => {
        stopServer();
        done();
    });

    test('GET / should return index.html', async () => {
        const res = await request(server).get('/');
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toMatch(/html/);
        expect(res.text).toContain('<h1>'); // Assuming index.html contains <h1>
    });

    test('GET /nonexistent should return 404', async () => {
        const res = await request(server).get('/nonexistent');
        expect(res.statusCode).toBe(404);
    });
});
