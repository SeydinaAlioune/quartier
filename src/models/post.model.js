const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverUrl: {
    type: String, // chemin relatif vers /uploads/xxx
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'published'
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  comments: [
    {
      content: { type: String, required: true },
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      createdAt: { type: Date, default: Date.now },
      status: { type: String, enum: ['approved', 'pending', 'rejected'], default: 'approved' }
    }
  ],
  views: { type: Number, default: 0 }
}, {
  timestamps: true
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
