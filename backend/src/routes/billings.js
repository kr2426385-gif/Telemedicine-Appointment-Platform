const express = require('express');
const Billing = require('../models/Billing');
const Appointment = require('../models/Appointment');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res, next) => {
  try {
    const filter = req.user.role === 'doctor' ? { doctor: req.user._id } : { patient: req.user._id };
    const billings = await Billing.find(filter)
      .populate('doctor', 'name email')
      .populate('patient', 'name email')
      .populate('appointment', 'date time status')
      .sort({ createdAt: -1 });

    res.json({ count: billings.length, billings });
  } catch (err) {
    next(err);
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can create bills' });
    }

    const { appointmentId, patientId, amount, description } = req.body;
    if (!patientId || amount === undefined) {
      return res.status(400).json({ message: 'Patient and amount are required' });
    }

    const billing = await Billing.create({
      appointment: appointmentId || undefined,
      doctor: req.user._id,
      patient: patientId,
      amount,
      description
    });

    res.status(201).json(billing);
  } catch (err) {
    next(err);
  }
});

router.post('/from-appointment/:appointmentId', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can create bills' });
    }

    const appointment = await Appointment.findById(req.params.appointmentId);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const billing = await Billing.create({
      appointment: appointment._id,
      doctor: appointment.doctor,
      patient: appointment.patient,
      amount: req.body.amount,
      description: req.body.description
    });

    res.status(201).json(billing);
  } catch (err) {
    next(err);
  }
});

router.put('/:id/pay', auth, async (req, res, next) => {
  try {
    const billing = await Billing.findById(req.params.id);
    if (!billing) return res.status(404).json({ message: 'Bill not found' });
    if (billing.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the patient can mark this bill paid' });
    }

    billing.status = 'paid';
    await billing.save();
    res.json(billing);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
