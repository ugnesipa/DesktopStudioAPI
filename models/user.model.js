// Importing necessary modules from Mongoose for schema creation and model definition
const { Schema, model } = require("mongoose");

// Importing bcryptjs to hash and compare passwords securely
const bcrypt = require('bcryptjs');

// User schema definition using Mongoose Schema
const userSchema = new Schema(
  {
    // Define the "username" field for storing user's full name
    username: { type: String, required: true, unique: true, trim: true },
    bio: { type: String, trim: true },

    profile_picture: {
      original: { type: String, default: '/data/default_avatar.png'      },   // path to full-sized profile picture
      thumbnail: { type: String, default: '/data/default_avatar_thumb.png' }   // path to the resized thumbnail
    },
    // Define the "email" field for storing user's email
    email: {
      type: String, // Data type: String
      unique: true, // Validation: Email must be unique
      lowercase: true, // Validation: Convert email to lowercase
      trim: true, // Validation: Remove leading/trailing spaces
      required: true, // Validation: Email is required
      // Regular expression pattern to validate email format
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please use a valid email address", // Error message if the email does not match the pattern
      ],
    },

    // Define the "password" field for storing user's password (hashed)
    password: {
      type: String, // Data type: String
      required: true, // Validation: Password is required
    },

    // Define the "role" field for setting the user's role
    role: {
      type: String, // Data type: String
      enum: ["user", "admin", "master"], // Validation: Role must be either 'user' or 'admin'
      default: "user", // Default role is 'user'
    },

    // Define the "followers" field for tracking the users following this user
    followers: [{ 
      type: Schema.Types.ObjectId, // Array of ObjectIds referencing other "User" models
      ref: "User", // Reference to the "User" model
    }],
    // Define the "following" field for tracking users that this user is following
    following: [{ 
      type: Schema.Types.ObjectId, // Array of ObjectIds referencing other "User" models
      ref: "User", // Reference to the "User" model
    }],

    savedContent: [{
      contentId: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'savedContent.contentType'
      },
      contentType: {
        type: String,
        required: true,
        enum: ['Wallpaper', 'Icon', 'DesktopTheme', 'IconTheme']
      }
    }],

    createdContent: [{
      contentId: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'createdContent.contentType'
      },
      contentType: {
        type: String,
        required: true,
        enum: ['Wallpaper', 'Icon', 'DesktopTheme', 'IconTheme']
      }
    }],

    installedContent: [{
    contentId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'installedContent.contentType'
    },
    contentType: {
      type: String,
      required: true,
      enum: ['Wallpaper', 'Icon', 'DesktopTheme', 'IconTheme']
    },
    iconType: { type: String }, // used if contentType is Icon
    installedAt: { type: Date, default: Date.now }
  }],

    reports: [{ type: Schema.Types.ObjectId, ref: 'Report' }],
    isFlagged: { type: Boolean, default: false },
    
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' } // to track who deleted the user
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields to the document
);

// Define a custom method on the User schema to compare the entered password with the stored hashed password
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

// Exclude soft deleted users from query results
userSchema.query.notDeleted = function () {
  return this.where({ isDeleted: false });
};

// Export the "User" model created using the userSchema
module.exports = model("User", userSchema);