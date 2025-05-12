// Destructure `Schema` and `model` from the `mongoose` library for defining and exporting schemas and models
const { Schema, model } = require('mongoose');

// Define the schema for a "Review" collection in MongoDB
const reportSchema = new Schema(
  {
    targetType: { type: String, enum: ['Wallpaper', 'Icon', 'DesktopTheme', 'IconTheme', 'User', 'Review', 'Request'], required: [true, 'content type must be one of the following: User, Wallpaper, Icon, DesktopTheme, IconTheme, Review or Request'] },
    targetId: { type: Schema.Types.ObjectId, required: true, refPath: 'targetType'  // Dynamically reference the model based on targetType
    },

    reportedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    reason: {
      type: String, // Data type: String
      required: [true, 'Reason is required choose one of the following: inappropriate or offensive content, malicious or harmful files, stolen or copyrighted material, spam, inadequate quality, harrasment or targeted attack, broken or corrupt files'], // Validation: Reason is required
      enum: ["inappropriate or offensive content","malicious or harmful files","stolen or copyrighted material","spam","inadequate quality","harrasment or targeted attack","broken or corrupt files"], // Validation: reason must be one of the provided options
    },
    // Define the "text" field (comment for the report)
    text: {
      type: String, // Data type: String
      required: true, // Validation: This field is mandatory with a custom error message
    },
    
    isDeleted: { type: Boolean, default: false }, // Added for soft delete
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' } // To track who deleted it
 
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` timestamps to the document
  }
);

// Export the model for use in other parts of the application
module.exports = model('Report', reportSchema);