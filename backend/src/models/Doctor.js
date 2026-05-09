const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  specialty: { type: String, required: true },
  location: { type: String, required: true },
  experience: { type: Number, default: 0 },
  availability: [
    {
      date: { type: Date, required: true },
      slots: [{ type: String, required: true }]
    }
  ],
  bio: { type: String, default: '' }
});

module.exports = mongoose.model('Doctor', doctorSchema);
