const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');
const donorsRouter = require('./routes/donors');
const patientsRouter = require('./routes/patients');
const bloodRouter = require('./routes/blood');
const organsRouter = require('./routes/organs');
const donationsRouter = require('./routes/donations');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Test database connection
async function testDatabaseConnection() {
  try {
    const [rows] = await db.execute('SELECT 1 as test');
    console.log('✅ Database connected successfully');
    console.log('Database:', process.env.DB_NAME);
    console.log('Host:', process.env.DB_HOST);
    console.log('Port:', process.env.DB_PORT);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Please check your MySQL server and credentials');
  }
}

// Routes
app.use('/api/donors', donorsRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/blood', bloodRouter);
app.use('/api/organs', organsRouter);
app.use('/api/donations', donationsRouter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT 1 as test');
    res.json({ status: 'OK', database: 'Connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'Error', database: 'Disconnected', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  testDatabaseConnection();
});