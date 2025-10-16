const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  buttonText: { type: String, default: '' },
  link: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  startsAt: { type: Date },
  endsAt: { type: Date },
}, { timestamps: true });

const Announcement = mongoose.model('Announcement', announcementSchema);
module.exports = Announcement;
