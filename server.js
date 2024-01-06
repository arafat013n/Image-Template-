const express = require('express');
const path = require('path');
const multer = require('multer');
const { uploadToFirebaseStorage } = require('./firebaseUpload');
const admin = require('firebase-admin');

const app = express();
const port = 3000;

// Load environment variables from .env file
require('dotenv').config();

// Firebase Admin initialization
const serviceAccount = require(path.resolve(__dirname, 'config', 'image-template-6-firebase-adminsdk-w8bki-763ea069b0.json'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_BUCKET_URL,
});

// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle the get upload route
app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

// Handle the about route
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

// Handle the privacy-policy route
app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy-policy.html'));
});

// Handle the upload route with authentication middleware
app.post('/upload', upload.array('file', 10), async (req, res) => {
  try {
    const files = req.files;
    const providedSecretKey = req.body.secretKey;

    // Check if the provided secret key matches the configured secret key
    if (providedSecretKey !== process.env.SECRET_KEY) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Invalidsecret key.' });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded.' });
    }

    // Use the Firebase upload module for each file
    await Promise.all(files.map(async (file) => {
      await uploadToFirebaseStorage(file.buffer, file.originalname);
    }));

    return res.status(200).json({ success: true, message: 'Files uploaded successfully.' });
  } catch (error) {
    console.error('Error uploading files to Firebase Storage:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error: ' + error.message });
  }
});

// Handle the route to get Firebase Storage images with pagination
app.get('/getImages', async (req, res) => {
  try {
    const storage = admin.storage();
    const bucket = storage.bucket();
    const [files] = await bucket.getFiles();

    // Get download URLs for each image
    const downloadUrls = await Promise.all(files.map(async (file) => {
      const [url] = await file.getSignedUrl({ action: 'read', expires: '01-01-2100' });
      return url;
    }));

    // Respond with the download URLs
    res.json({ images: downloadUrls });
  } catch (error) {
    console.error('Error fetching images from Firebase Storage:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
