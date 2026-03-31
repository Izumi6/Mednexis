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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/ai', aiRoutes);

// Static Files
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mednexis')
  .then(() => {
    console.log('Connected to MongoDB');
    // Vercel serverless functions do not need to strictly listen to ports
    if (process.env.NODE_ENV !== 'production') {
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    }
  })
  .catch((err) => console.error('Failed to connect to MongoDB', err));

module.exports = app;
