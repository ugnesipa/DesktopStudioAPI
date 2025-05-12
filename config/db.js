// Import the Mongoose library, which provides tools for working with MongoDB
const mongoose = require('mongoose');

// Define an initialization function to set up the database connection
const init = () => {
  // Determine the database URL based on the current environment
  const dbUrl = process.env.NODE_ENV === 'test' 
    ? process.env.TEST_DB_ATLAS_URL // Use the test database URL if in the test environment
    : process.env.DB_ATLAS_URL;    // Otherwise, use the default (production/development) database URL

  // Enable Mongoose debugging for detailed logging of database operations
  mongoose.set('debug', true);

  // Connect to the MongoDB database using the determined URL and connection options
  mongoose.connect(dbUrl, {
    useNewUrlParser: true,   // Use the new MongoDB connection string parser
    useUnifiedTopology: true, // Enable the new topology engine for better connection management
  })
  .catch(err => {
    // Log any connection errors that occur during the initial connection attempt
    console.log(`Error ${err.stack}`);
  });

  // Set up an event listener for when the connection to the database is successfully established
  mongoose.connection.on('open', () => {
    console.log(`Connected to Database: ${dbUrl}`); // Log a success message with the database URL
  });

  // Set up an event listener for errors that occur after the connection is established
  mongoose.connection.on('error', (err) => {
    console.error(`Mongoose connection error: ${err}`); // Log the error details
  });
};

// Export the `init` function so it can be used in other parts of the application
module.exports = init;