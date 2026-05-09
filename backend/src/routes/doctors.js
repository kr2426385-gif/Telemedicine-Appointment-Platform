const express = require('express');
const Doctor = require('../models/Doctor');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { specialty, location } = req.query;
    const filters = {};
    if (specialty) filters.specialty = new RegExp(specialty, 'i');
    if (location) filters.location = new RegExp(location, 'i');

    const doctors = await Doctor.find(filters).populate('user', 'name email');
    res.json({ count: doctors.length, doctors });
  } catch (err) {
    next(err);
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const { specialty, location, experience, availability, bio } = req.body;
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can add a profile' });
    }

    const doctor = await Doctor.create({
      user: req.user._id,
      specialty,
      location,
      experience,
      availability,
      bio
    });

    res.status(201).json(doctor);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('user', 'name email');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
