// Destructure `Schema` and `model` from the `mongoose` library for defining and exporting schemas and models
const { Schema, model } = require('mongoose');
// Define the schema for the 'Wallpaper' model
const wallpaperSchema = new Schema(
  {
    // Define the "title" field for storing the wallpaper title
    title: {
      type: String, // Data type: String
      required: true, // Validation: Title is required
    },
    // Define the "description" field for storing the wallpaper description
    description: {
      type: String, // Data type: String
      required: true, // Validation: Description is required
    },
    // Define the "image" field for storing the URL of the wallpaper image
    imageFile: {
      type: String, // Data type: String
      required: true, // Validation: Image URL is required
    },
    thumbnail: {
      type: String, // Data type: String
      required: true, // Validation: Image URL is required
    },
    // Define the "category" field for storing the wallpaper category
    category: {
      type: String, // Data type: String
      required: [true, 'Category must be one of the following: abstract, animation, music, work, fantasy, games, sci-fi, landscape, memes, music, nature, sports, technology, cars, work, other'], // Validation: Category is required
      enum: ["abstract","animation","music","work","fantasy","games","sci-fi","landscape","memes","music","nature","sports","technology","cars","work","other"], // Validation: category must be one of the provided options
    },
    // Define the "tags" field for storing an array of tags associated with the wallpaper
    tags: [{ 
      type: String, // Data type: String
      maxlength: 100,
      required: false, // Validation: tags are not required
    }],

    createdBy: {
      type: Schema.Types.ObjectId, // Reference to a `User` document by its ObjectId
      ref: 'User', // Reference to the "User" model
      required: [true, 'User is required'], // Validation: A review must be associated with a user
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
     // to track who deleted the user
},
{ timestamps: true } // Automatically adds createdAt and updatedAt fields to the document
);

// Export the model for use in other parts of the application
module.exports = model('Wallpaper', wallpaperSchema);