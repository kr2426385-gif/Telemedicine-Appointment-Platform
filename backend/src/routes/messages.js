const express = require('express');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res, next) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }]
    })
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ count: messages.length, messages });
  } catch (err) {
    next(err);
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const { receiverId, appointmentId, content } = req.body;
    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver and message are required' });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      appointment: appointmentId || undefined,
      content
    });

    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
