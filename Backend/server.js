const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const adminModule = require('firebase-admin');
const admin = adminModule.default || adminModule;
require('dotenv').config();

// Load Firebase credentials safely (JSON file locally, Env vars on Render)
let serviceAccount;
try {
    serviceAccount = require('./firebase-service-account.json');
} catch (err) {
    serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
    };
}

if (!admin.apps.length && serviceAccount.projectId) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized successfully');
}

const app = express();

app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json());

// Serve the 'uploads' folder publicly for images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const teamRoutes = require('./src/routes/teamRoutes');
const eventRoutes = require('./src/routes/eventRoutes');
const inquiryRoutes = require('./src/routes/inquiryRoutes');
const linkRoutes = require('./src/routes/linkRoutes');
const websiteRoutes = require('./src/routes/websiteRoutes');
const todoRoutes = require('./src/routes/todoRoutes');
const integrationRoutes = require('./src/routes/integrationRoutes');
const chatRoutes = require('./src/routes/chatRoutes.js');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/chats', chatRoutes);

const PORT = process.env.PORT || 5001;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
      console.log('MongoDB connected');
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.log(err));