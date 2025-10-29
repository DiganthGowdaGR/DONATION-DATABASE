const express = require('express');
const db = require('../db');
const router = express.Router();

// Get all donors
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Donor');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new donor
router.post('/', async (req, res) => {
  try {
    const { name, age, gender, bloodGroup, address, contact, disease } = req.body;
    const [result] = await db.execute(
      'INSERT INTO Donor (Name, Age, Gender, BloodGroup, Address, Contact, Disease) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, age, gender, bloodGroup, address, contact, disease]
    );
    res.status(201).json({ id: result.insertId, message: 'Donor added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update donor
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, age, gender, bloodGroup, address, contact, disease } = req.body;
    await db.execute(
      'UPDATE Donor SET Name = ?, Age = ?, Gender = ?, BloodGroup = ?, Address = ?, Contact = ?, Disease = ? WHERE DonorID = ?',
      [name, age, gender, bloodGroup, address, contact, disease, id]
    );
    res.json({ message: 'Donor updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete donor
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM Donor WHERE DonorID = ?', [id]);
    res.json({ message: 'Donor deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;