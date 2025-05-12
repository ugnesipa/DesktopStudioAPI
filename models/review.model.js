// Destructure `Schema` and `model` from the `mongoose` library for defining and exporting schemas and models
const { Schema, model } = require('mongoose');

// Define the schema for a "Review" collection in MongoDB
const reviewSchema = new Schema(
  {
    contentType: { type: String, enum: ['Wallpaper', 'Icon', 'DesktopTheme', 'IconTheme', 'Request'], required: true },
    contentId: { type: Schema.Types.ObjectId, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,

    isFlagged: {
      type: Boolean,
      default: false,
    },
    reports: [{ type: Schema.Types.ObjectId, ref: 'Report' }],
    isDeleted: { type: Boolean, default: false }, // Added for soft delete
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' } // To track who deleted it
 
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` timestamps to the document
  }
);

// Export the model for use in other parts of the application
module.exports = model('Review', reviewSchema);