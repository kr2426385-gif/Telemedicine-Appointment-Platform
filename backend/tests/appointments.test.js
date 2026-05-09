const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Appointment = require('../src/models/Appointment');

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
  await Appointment.deleteMany();
});

describe('Appointment API', () => {
  test('patient can book appointment and receives 201', async () => {
    const patient = await User.create({ name: 'Patient', email: 'p@example.com', password: 'hash', role: 'patient' });
    const doctor = await User.create({ name: 'Doctor', email: 'd@example.com', password: 'hash', role: 'doctor' });
    const token = require('jsonwebtoken').sign({ id: patient._id, role: patient.role }, process.env.JWT_SECRET || 'secret-key');

    const response = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ doctorId: doctor._id, date: new Date().toISOString(), time: '10:00', notes: 'Test booking' });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('_id');
    expect(response.body.status).toBe('pending');
  });

  test('denies appointment booking when slot is already taken', async () => {
    const patient = await User.create({ name: 'Patient', email: 'p2@example.com', password: 'hash', role: 'patient' });
    const doctor = await User.create({ name: 'Doctor', email: 'd2@example.com', password: 'hash', role: 'doctor' });
    const appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      date: new Date().toISOString(),
      time: '09:00',
      status: 'confirmed'
    });
    const token = require('jsonwebtoken').sign({ id: patient._id, role: patient.role }, process.env.JWT_SECRET || 'secret-key');

    const response = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ doctorId: doctor._id, date: appointment.date, time: '09:00' });

    expect(response.statusCode).toBe(409);
    expect(response.body.message).toMatch(/unavailable/i);
  });
});
