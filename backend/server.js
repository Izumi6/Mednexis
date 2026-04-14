require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('../routes/authRoutes');
const appointmentRoutes = require('../routes/appointmentRoutes');
const recordRoutes = require('../routes/recordRoutes');
const aiRoutes = require('../routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/ai', aiRoutes);

// Static Files (for local dev — Vercel serves public/ automatically)
app.use(express.static(path.join(__dirname, '../public')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mednexis:Asmita%40123@cluster0.kmazbaa.mongodb.net/mednexis?appName=Cluster0';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    if (process.env.NODE_ENV !== 'production') {
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    }
  })
  .catch((err) => console.error('Failed to connect to MongoDB', err));

module.exports = app;
