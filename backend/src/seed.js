
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const connectDb = require('./config/db');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');

const password = 'Password123';

const sampleDoctors = [
  {
    name: 'Dr. Aisha Mehta',
    email: 'aisha.mehta@example.com',
    specialty: 'Cardiology',
    location: 'Delhi',
    experience: 12,
    bio: 'Cardiologist focused on preventive heart care and tele-consultations.'
  },
  {
    name: 'Dr. Rohan Sharma',
    email: 'rohan.sharma@example.com',
    specialty: 'Dermatology',
    location: 'Mumbai',
    experience: 8,
    bio: 'Dermatologist treating skin, hair, and allergy concerns online.'
  },
  {
    name: 'Dr. Neha Verma',
    email: 'neha.verma@example.com',
    specialty: 'Pediatrics',
    location: 'Bengaluru',
    experience: 10,
    bio: 'Pediatrician helping families with child health and routine follow-ups.'
  }
];

const upsertUser = async ({ name, email, role }) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  return User.findOneAndUpdate(
    { email },
    {
      name,
      email,
      role,
      password: hashedPassword
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  );
};

const seed = async () => {
  await connectDb();

  console.log('Connected to database');

  // Create patient
  const patient = await upsertUser({
    name: 'Demo Patient',
    email: 'patient@example.com',
    role: 'patient'
  });

  // Create doctors
  for (const doctorData of sampleDoctors) {
    const doctorUser = await upsertUser({
      name: doctorData.name,
      email: doctorData.email,
      role: 'doctor'
    });

    await Doctor.findOneAndUpdate(
      {
        specialty: doctorData.specialty,
        location: doctorData.location
      },
      {
        user: doctorUser._id,
        specialty: doctorData.specialty,
        location: doctorData.location,
        experience: doctorData.experience,
        bio: doctorData.bio,
        availability: [
          {
            date: new Date(),
            slots: ['09:00', '10:00', '11:30', '15:00']
          }
        ]
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );
  }

  // Remove old index
  try {
    await Appointment.collection.dropIndex(
      'doctor_1_appointmentDate_1_startTime_1'
    );

    console.log('Removed old appointment index');
  } catch (error) {
    if (error.codeName !== 'IndexNotFound') {
      throw error;
    }
  }

  console.log('Seed complete');
  console.log(`Patient login: ${patient.email} / ${password}`);
  console.log(`Doctor login: ${sampleDoctors[0].email} / ${password}`);
};

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });