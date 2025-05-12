// models/icon.model.js
const { Schema, model } = require('mongoose');

const iconSchema = new Schema(
  {
    iconType: {
      type: String,
      required: true,
      enum: [
        "Folder",
        "Discord",
        "Chrome",
        "Opera",
        "Steam",
        "Epic Games",
        "Riot Games",
        "Spotify",
        "Other"
      ]
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: true
    },
    thumbnail: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: [true, 'Category must be one of the following: abstract, animation, music, work, fantasy, games, sci-fi, landscape, memes, music, nature, sports, technology, cars, work, other'], // Validation: Category is required
      enum: [
        "abstract",
        "cartoon",
        "music",
        "work",
        "fantasy",
        "games",
        "sci-fi",
        "landscape",
        "memes",
        "nature",
        "sports",
        "technology",
        "cars",
        "other"
      ]
    },
    tags: [
      {
        type: String,
        maxlength: 100,
        required: false
      }
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    installable: { type: Boolean, default: true },
    
    reports: [{ type: Schema.Types.ObjectId, ref: 'Report' }],
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
    
    isApproved: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false },
    isFlagged: { type: Boolean, default: false },
    
    saved: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = model('Icon', iconSchema);
