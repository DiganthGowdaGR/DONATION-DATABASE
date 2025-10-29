const express = require('express');
const db = require('../db');
const router = express.Router();

// Get blood inventory with bank details
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT b.BloodID, b.BloodGroup, b.Quantity, bb.Name as BankName, bb.Location 
      FROM Blood b 
      LEFT JOIN BloodBank bb ON b.BankID = bb.BankID
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blood banks
router.get('/banks', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM BloodBank');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new blood record
router.post('/', async (req, res) => {
  try {
    const { bloodGroup, quantity, bankID } = req.body;
    const [result] = await db.execute(
      'INSERT INTO Blood (BloodGroup, Quantity, BankID) VALUES (?, ?, ?)',
      [bloodGroup, quantity, bankID]
    );
    res.status(201).json({ id: result.insertId, message: 'Blood record added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize all blood groups if they don't exist
router.post('/initialize', async (req, res) => {
  try {
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const bankID = 1; // Default to first bank
    
    for (const bloodGroup of bloodGroups) {
      // Check if blood group already exists
      const [existing] = await db.execute(
        'SELECT BloodID FROM Blood WHERE BloodGroup = ? AND BankID = ?',
        [bloodGroup, bankID]
      );
      
      // If doesn't exist, create it with 0 quantity
      if (existing.length === 0) {
        await db.execute(
          'INSERT INTO Blood (BloodGroup, Quantity, BankID) VALUES (?, 0, ?)',
          [bloodGroup, bankID]
        );
      }
    }
    
    res.json({ message: 'All blood groups initialized successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Find or create blood record for donation
router.post('/find-or-create', async (req, res) => {
  try {
    const { bloodGroup, bankID = 1 } = req.body;
    
    // First try to find existing record
    let [rows] = await db.execute(
      'SELECT BloodID, Quantity FROM Blood WHERE BloodGroup = ? AND BankID = ?',
      [bloodGroup, bankID]
    );
    
    // If doesn't exist, create it
    if (rows.length === 0) {
      const [result] = await db.execute(
        'INSERT INTO Blood (BloodGroup, Quantity, BankID) VALUES (?, 0, ?)',
        [bloodGroup, bankID]
      );
      
      // Get the newly created record
      [rows] = await db.execute(
        'SELECT BloodID, Quantity FROM Blood WHERE BloodID = ?',
        [result.insertId]
      );
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update blood inventory
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    await db.execute(
      'UPDATE Blood SET Quantity = ? WHERE BloodID = ?',
      [quantity, id]
    );
    res.json({ message: 'Blood inventory updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;