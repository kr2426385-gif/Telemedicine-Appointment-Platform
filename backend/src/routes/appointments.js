const express = require('express');
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, async (req, res, next) => {
  try {
    const { doctorId, date, time, notes } = req.body;
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can book appointments' });
    }

    if (!doctorId || !date || !time) {
      return res.status(400).json({ message: 'Doctor, date and time are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: 'Selected doctor is invalid' });
    }

    const doctorProfile = await Doctor.findById(doctorId);
    const doctorUserId = doctorProfile ? doctorProfile.user : doctorId;

    if (!doctorUserId) {
      return res.status(400).json({ message: 'Selected doctor is invalid' });
    }

    const exists = await Appointment.findOne({ doctor: doctorUserId, date, time, status: { $in: ['pending', 'confirmed'] } });
    if (exists) {
      return res.status(409).json({ message: 'Selected time slot is unavailable' });
    }

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorUserId,
      date,
      time,
      notes
    });
    res.status(201).json(appointment);
  } catch (err) {
    next(err);
  }
});

router.get('/', auth, async (req, res, next) => {
  try {
    const filter = req.user.role === 'doctor' ? { doctor: req.user._id } : { patient: req.user._id };
    const appointments = await Appointment.find(filter).populate('patient', 'name email').lean();

    for (const appointment of appointments) {
      let doctorUser = await mongoose.model('User').findById(appointment.doctor).select('name email').lean();

      if (!doctorUser) {
        const doctorProfile = await Doctor.findById(appointment.doctor).populate('user', 'name email').lean();
        doctorUser = doctorProfile?.user || null;
      }

      appointment.doctor = doctorUser;
    }

    res.json({ count: appointments.length, appointments });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.body.status !== undefined && req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can update appointment status' });
    }

    if (req.user.role === 'doctor' && req.body.status && !['confirmed', 'cancelled', 'completed'].includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid appointment status' });
    }

    const updates = ['date', 'time', 'status', 'notes'];
    updates.forEach((field) => {
      if (req.body[field] !== undefined) appointment[field] = req.body[field];
    });

    await appointment.save();
    res.json(appointment);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (appointment.patient.toString() !== req.user._id.toString() && appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await appointment.deleteOne();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
