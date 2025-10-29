const express = require('express');
const db = require('../db');
const router = express.Router();

// Get organ inventory with bank details
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT o.OrganID, o.OrganType, o.OrganCondition, o.Quantity, ob.Name as BankName, ob.Location 
      FROM Organ o 
      LEFT JOIN OrganBank ob ON o.OrganBankID = ob.OrganBankID
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get organ banks
router.get('/banks', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM OrganBank');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new organ record
router.post('/', async (req, res) => {
  try {
    const { organType, organCondition, organBankID, quantity } = req.body;
    const [result] = await db.execute(
      'INSERT INTO Organ (OrganType, OrganCondition, OrganBankID, Quantity) VALUES (?, ?, ?, ?)',
      [organType, organCondition, organBankID, quantity]
    );
    res.status(201).json({ id: result.insertId, message: 'Organ record added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update organ inventory
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, organCondition } = req.body;
    await db.execute(
      'UPDATE Organ SET Quantity = ?, OrganCondition = ? WHERE OrganID = ?',
      [quantity, organCondition, id]
    );
    res.json({ message: 'Organ inventory updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;