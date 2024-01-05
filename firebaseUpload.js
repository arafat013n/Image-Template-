// firebaseUpload.js

const admin = require('firebase-admin');

/**
 * Uploads a file to Firebase Storage.
 * @param {Buffer} fileBuffer - The file buffer to be uploaded.
 * @param {string} fileName - The desired file name in Firebase Storage.
 * @returns {Promise<void>} A Promise that resolves when the file is uploaded.
 */
async function uploadToFirebaseStorage(fileBuffer, fileName) {
  const storageRef = admin.storage().bucket().file(fileName);

  // Upload the file to Firebase Storage
  await storageRef.createWriteStream().end(fileBuffer);
}

module.exports = { uploadToFirebaseStorage };