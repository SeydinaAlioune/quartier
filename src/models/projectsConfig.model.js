const mongoose = require('mongoose');

const faqItemSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  answer: { type: String, required: true, trim: true },
}, { _id: false });

const progressSchema = new mongoose.Schema({
  proposed: { type: Number, default: 5, min: 0, max: 100 },
  planning: { type: Number, default: 15, min: 0, max: 100 },
  in_progress: { type: Number, default: 50, min: 0, max: 100 },
  completed: { type: Number, default: 100, min: 0, max: 100 },
  cancelled: { type: Number, default: 0, min: 0, max: 100 },
}, { _id: false });

const projectsConfigSchema = new mongoose.Schema({
  faq: { type: [faqItemSchema], default: [] },
  progressByStatus: { type: progressSchema, default: () => ({}) },
  updatedAt: { type: Date, default: Date.now },
});

projectsConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const ProjectsConfig = mongoose.model('ProjectsConfig', projectsConfigSchema);
module.exports = ProjectsConfig;
