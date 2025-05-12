const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const requestSchema = new Schema({
  category: {
    type: String,
    enum: ['wallpaper', 'icon', 'icon theme', 'desktop theme', 'any'],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  isFlagged: {
    type: Boolean,
    default: false,
  },
  reports: [{
    type: Schema.Types.ObjectId,
    ref: 'Report',
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  reviews: [{
    type: Schema.Types.ObjectId,
    ref: 'Review'
  }]
}, {
  timestamps: true
});

module.exports = model('Request', requestSchema);
