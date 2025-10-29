const express = require('express');
const db = require('../db');
const router = express.Router();

// Get all donations with related data
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT dr.DonationID, dr.DonationDate, dr.Quantity, dr.OrganType, dr.Notes,
             d.Name as DonorName, d.BloodGroup as DonorBloodGroup,
             p.Name as PatientName, p.BloodGroup as PatientBloodGroup,
             b.BloodGroup, bb.Name as BankName,
             o.OrganType as OrganTypeName, o.OrganCondition
      FROM DonationRecord dr
      LEFT JOIN Donor d ON dr.DonorID = d.DonorID
      LEFT JOIN Patient p ON dr.PatientID = p.PatientID
      LEFT JOIN Blood b ON dr.BloodID = b.BloodID
      LEFT JOIN BloodBank bb ON dr.BankID = bb.BankID
      LEFT JOIN Organ o ON dr.OrganID = o.OrganID
      ORDER BY dr.DonationDate DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record new donation
router.post('/', async (req, res) => {
  try {
    const { donationDate, quantity, organType, donorID, patientID, bloodID, organID, bankID, notes } = req.body;
    
    // Convert empty strings to null for integer fields
    const processedData = {
      donationDate,
      quantity: quantity || 0,
      organType: organType || null,
      donorID: donorID || null,
      patientID: patientID || null,
      bloodID: bloodID || null,
      organID: organID || null,
      bankID: bankID || null,
      notes: notes || null
    };

    const [result] = await db.execute(
      'INSERT INTO DonationRecord (DonationDate, Quantity, OrganType, DonorID, PatientID, BloodID, OrganID, BankID, Notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        processedData.donationDate,
        processedData.quantity,
        processedData.organType,
        processedData.donorID,
        processedData.patientID,
        processedData.bloodID,
        processedData.organID,
        processedData.bankID,
        processedData.notes
      ]
    );
    res.status(201).json({ id: result.insertId, message: 'Donation recorded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete donation record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.execute('DELETE FROM DonationRecord WHERE DonationID = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Donation record not found' });
    }
    
    res.json({ message: 'Donation deleted successfully. Inventory restored by triggers.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit logs
router.get('/audit', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM AuditLog ORDER BY EventTime DESC LIMIT 100');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blood compatibility for a patient
router.get('/compatibility/:bloodGroup', async (req, res) => {
  try {
    const { bloodGroup } = req.params;
    const [rows] = await db.execute('CALL GetBloodCompatibility(?)', [bloodGroup]);
    res.json(rows[0]); // Stored procedures return results in first element
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get inventory report
router.get('/inventory-report', async (req, res) => {
  try {
    const [rows] = await db.execute('CALL GetInventoryReport()');
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get donor history
router.get('/donor-history/:donorId', async (req, res) => {
  try {
    const { donorId } = req.params;
    const [rows] = await db.execute('CALL GetDonorHistory(?)', [donorId]);
    res.json({
      donations: rows[0],
      summary: rows[1][0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get critical patients
router.get('/critical-patients', async (req, res) => {
  try {
    const [rows] = await db.execute('CALL GetCriticalPatients()');
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process donation using stored procedure
router.post('/process', async (req, res) => {
  try {
    const { donorID, patientID, bloodID, organID, quantity, notes } = req.body;
    
    const [rows] = await db.execute(
      'CALL ProcessDonation(?, ?, ?, ?, ?, ?, @result_code, @result_message)',
      [donorID || null, patientID || null, bloodID || null, organID || null, quantity, notes || null]
    );
    
    // Get the output parameters
    const [result] = await db.execute('SELECT @result_code as code, @result_message as message');
    const { code, message } = result[0];
    
    if (code === 0) {
      res.json({ success: true, message });
    } else {
      res.status(400).json({ success: false, error: message, code });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test MySQL Functions
router.get('/functions/compatibility-score/:donorBlood/:patientBlood', async (req, res) => {
  try {
    const { donorBlood, patientBlood } = req.params;
    const [rows] = await db.execute(
      'SELECT CalculateBloodCompatibilityScore(?, ?) as compatibilityScore',
      [donorBlood, patientBlood]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/functions/donor-risk/:age/:disease', async (req, res) => {
  try {
    const { age, disease } = req.params;
    const diseaseParam = disease === 'none' ? null : decodeURIComponent(disease);
    const [rows] = await db.execute(
      'SELECT GetDonorRiskLevel(?, ?) as riskLevel',
      [parseInt(age), diseaseParam]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/functions/inventory-value/:type/:quantity/:item', async (req, res) => {
  try {
    const { type, quantity, item } = req.params;
    const [rows] = await db.execute(
      'SELECT CalculateInventoryValue(?, ?, ?) as inventoryValue',
      [type, parseInt(quantity), decodeURIComponent(item)]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/functions/patient-priority/:days/:bloodGroup/:units', async (req, res) => {
  try {
    const { days, bloodGroup, units } = req.params;
    const [rows] = await db.execute(
      'SELECT GetPatientWaitingPriority(?, ?, ?) as priorityScore',
      [parseInt(days), bloodGroup, parseInt(units)]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Real database-driven functions
router.get('/functions/donor-summary/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const [rows] = await db.execute(
      'SELECT GetDonorSummaryByName(?) as donorSummary',
      [decodeURIComponent(name)]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/functions/total-inventory-value', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT GetTotalInventoryValue() as totalValue');
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/functions/patient-urgency/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const [rows] = await db.execute(
      'SELECT GetPatientUrgencyByName(?) as urgencyScore',
      [decodeURIComponent(name)]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/functions/blood-bank-status/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const [rows] = await db.execute(
      'SELECT GetBloodBankStatus(?) as bankStatus',
      [decodeURIComponent(name)]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/functions/donation-trends', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT GetDonationTrendAnalysis() as trendAnalysis');
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced reports using functions
router.get('/functions/enhanced-compatibility/:patientBlood', async (req, res) => {
  try {
    const { patientBlood } = req.params;
    const [rows] = await db.execute(`
      SELECT 
        d.DonorID,
        d.Name as DonorName,
        d.BloodGroup as DonorBloodGroup,
        d.Age,
        d.Disease,
        b.Quantity as AvailableUnits,
        bb.Name as BankName,
        CalculateBloodCompatibilityScore(d.BloodGroup, ?) as CompatibilityScore,
        GetDonorRiskLevel(d.Age, d.Disease) as RiskLevel,
        CalculateInventoryValue('BLOOD', b.Quantity, d.BloodGroup) as InventoryValue
      FROM Donor d
      LEFT JOIN Blood b ON d.BloodGroup = b.BloodGroup
      LEFT JOIN BloodBank bb ON b.BankID = bb.BankID
      WHERE CalculateBloodCompatibilityScore(d.BloodGroup, ?) > 0
        AND b.Quantity > 0
      ORDER BY CompatibilityScore DESC, AvailableUnits DESC
    `, [patientBlood, patientBlood]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;