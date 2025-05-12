// awsHelper.js
const s3 = require('../config/aws.js'); // Import the S3 instance from awsConfig.js

// Upload file to S3
const uploadToS3 = async (fileBuffer, fileName, mimeType) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME, // Ensure you have this in your .env
    Key: fileName, // The file name for the image in S3
    Body: fileBuffer, // The actual image buffer
    ContentType: mimeType, // MIME type of the file (jpeg, png, etc.)
    ACL: 'public-read', // You can adjust this depending on your needs
  };

  try {
    const uploadResult = await s3.upload(params).promise(); // Upload the file to S3
    return uploadResult.Location; // Return the file's URL
  } catch (err) {
    throw new Error('Error uploading file to S3: ' + err.message);
  }
};

// Delete file from S3
const deleteFromS3 = async (fileName) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME, // Ensure you have this in your .env
    Key: fileName, // The file name to delete
  };

  try {
    await s3.deleteObject(params).promise(); // Delete the file from S3
    console.log(`Successfully deleted ${fileName} from S3.`);
  } catch (err) {
    throw new Error('Error deleting file from S3: ' + err.message);
  }
};

module.exports = { uploadToS3, deleteFromS3 };
