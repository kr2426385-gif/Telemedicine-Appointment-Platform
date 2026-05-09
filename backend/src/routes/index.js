const express = require('express');
const authRoutes = require('./auth');
const doctorRoutes = require('./doctors');
const appointmentRoutes = require('./appointments');
const prescriptionRoutes = require('./prescriptions');
const billingRoutes = require('./billings');
const messageRoutes = require('./messages');

const router = express.Router();

// Public route
router.get('/', (req, res) => {
  res.json({
    message: 'Telemedicine Appointment Platform API',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      doctors: '/doctors',
      appointments: '/appointments',
      prescriptions: '/prescriptions',
      billings: '/billings',
      messages: '/messages'
    }
  });
});

router.use('/auth', authRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/billings', billingRoutes);
router.use('/messages', messageRoutes);

module.exports = router;
