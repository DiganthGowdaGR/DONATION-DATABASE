const express = require('express');
const db = require('../db');
const router = express.Router();

// Get all patients
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Patient');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new patient
router.post('/', async (req, res) => {
  try {
    const { name, age, gender, bloodGroup, address, contact, dateOfIntake } = req.body;
    const [result] = await db.execute(
      'INSERT INTO Patient (Name, Age, Gender, BloodGroup, Address, Contact, DateOfIntake) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, age, gender, bloodGroup, address, contact, dateOfIntake]
    );
    res.status(201).json({ id: result.insertId, message: 'Patient added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update patient
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, age, gender, bloodGroup, address, contact, dateOfIntake } = req.body;
    await db.execute(
      'UPDATE Patient SET Name = ?, Age = ?, Gender = ?, BloodGroup = ?, Address = ?, Contact = ?, DateOfIntake = ? WHERE PatientID = ?',
      [name, age, gender, bloodGroup, address, contact, dateOfIntake, id]
    );
    res.json({ message: 'Patient updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete patient
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM Patient WHERE PatientID = ?', [id]);
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;