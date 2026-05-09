const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');

jest.setTimeout(30000);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany();
});

describe('Auth API', () => {
  test('registers a user and returns a token', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test Patient', email: 'patient@example.com', password: 'Password123', role: 'patient' });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe('patient@example.com');
  });

  test('rejects login with invalid credentials', async () => {
    await User.create({ name: 'Jane', email: 'jane@example.com', password: 'invalid', role: 'patient' });
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'jane@example.com', password: 'Password123' });

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toMatch(/invalid credentials/i);
  });
});
