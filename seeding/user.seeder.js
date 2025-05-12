const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');  // Import your User model
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const path = require('path');
require("dotenv").config(); // Loading environment variables from .env file

// Admin and regular user to seed
const users = [
    {
      username: "master_user",  // Username of the master user
      email: "master@example.com",  // Email of the master user
      password: "masterpassword",  // Password of the master user (this will be hashed)
      role: "master",  // Role of the master user
      bio: "This is the master user account",  // Bio for the master user
      profile_picture: {
        original: "/data/default_master.png",  // Path to the default profile picture for master user
        thumbnail: "/data/default_master_thumb.png",  // Path to the thumbnail of the master user's profile picture
      },
    },
    {
      username: "regular_user",  // Username of the regular user
      email: "user@example.com",  // Email of the regular user
      password: "userpassword",  // Password of the regular user (this will be hashed)
      role: "user",  // Role of the regular user
      bio: "This is a regular user account",  // Bio for the regular user
      profile_picture: {
        original: "/data/default_avatar.png",  // Path to the default profile picture for regular user
        thumbnail: "/data/default_avatar_thumb.png",  // Path to the thumbnail of the regular user's profile picture
      },
    },
  ];
  
  // Function to seed the database with users
  const seedDB = async () => {
    try {
      console.log("Connecting to the database...");
  
      // Connect to the MongoDB database
      await mongoose.connect(process.env.DB_ATLAS_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
  
      console.log("Connected to the database.");
  
      console.log("Deleting existing users...");
      // Delete existing users to avoid duplicates
      await User.deleteMany();
      console.log("Existing users deleted.");
  
      console.log("Seeding users...");
  
      // Hash the password for each user before storing it
      for (let user of users) {
        user.password = bcrypt.hashSync(user.password, 10);  // Hash the password using bcrypt
      }
  
      // Insert users into the database
      await User.insertMany(users);
      console.log("Users seeded successfully.");
  
      console.log("Database seeding completed!");
    } catch (error) {
      console.error("Error during seeding process:", error.message);
    } finally {
      // Close the database connection after seeding is complete
      await mongoose.disconnect();
      console.log("Database connection closed.");
    }
  };
  
  // Run the seeding function
  seedDB();