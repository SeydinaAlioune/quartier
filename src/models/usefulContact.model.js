const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  number: { type: String, required: true, trim: true },
  note: { type: String, trim: true }
}, { _id: true });

const usefulContactCategorySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  order: { type: Number, default: 0 },
  contacts: [contactSchema]
}, { timestamps: true });

usefulContactCategorySchema.index({ order: 1, createdAt: -1 });

const UsefulContactCategory = mongoose.model('UsefulContactCategory', usefulContactCategorySchema);

module.exports = UsefulContactCategory;
