const express = require('express');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res, next) => {
  try {
    const filter = req.user.role === 'doctor' ? { doctor: req.user._id } : { patient: req.user._id };
    const prescriptions = await Prescription.find(filter)
      .populate('doctor', 'name email')
      .populate('patient', 'name email')
      .populate('appointment', 'date time status')
      .sort({ createdAt: -1 });

    res.json({ count: prescriptions.length, prescriptions });
  } catch (err) {
    next(err);
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can create prescriptions' });
    }

    const { appointmentId, patientId, notes, medicines } = req.body;
    if (!appointmentId || !patientId || !notes) {
      return res.status(400).json({ message: 'Appointment, patient and clinical notes are required' });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (appointment.patient.toString() !== patientId.toString()) {
      return res.status(400).json({ message: 'Patient does not match this appointment' });
    }

    const prescription = await Prescription.create({
      appointment: appointmentId,
      doctor: req.user._id,
      patient: patientId,
      notes,
      medicines
    });

    res.status(201).json(prescription);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', auth, async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('doctor', 'name email')
      .populate('patient', 'name email');

    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
    if ([prescription.doctor._id.toString(), prescription.patient._id.toString()].includes(req.user._id.toString()) || req.user.role === 'admin') {
      return res.json(prescription);
    }

    res.status(403).json({ message: 'Access denied' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
