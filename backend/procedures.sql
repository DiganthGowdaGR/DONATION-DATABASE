-- ================================
-- STORED PROCEDURES FOR DONATION SYSTEM
-- ================================
USE donation_db;

DELIMITER $

/*
  PROCEDURE: GetBloodCompatibility
  PURPOSE: Find compatible blood donors for a patient based on blood type compatibility rules
  PARAMETERS: 
    - p_patient_blood_group: Patient's blood group
  RETURNS: List of compatible donors with their blood groups and availability
  
  WHY USED: Blood compatibility is complex (A+ can receive from A+, A-, O+, O-, etc.)
  This procedure encapsulates the business logic for blood compatibility matching.
*/
DROP PROCEDURE IF EXISTS GetBloodCompatibility$
CREATE PROCEDURE GetBloodCompatibility(IN p_patient_blood_group VARCHAR(5))
BEGIN
  DECLARE compatible_groups TEXT DEFAULT '';
  
  -- Define compatibility rules based on medical standards
  CASE p_patient_blood_group
    WHEN 'A+' THEN SET compatible_groups = 'A+,A-,O+,O-';
    WHEN 'A-' THEN SET compatible_groups = 'A-,O-';
    WHEN 'B+' THEN SET compatible_groups = 'B+,B-,O+,O-';
    WHEN 'B-' THEN SET compatible_groups = 'B-,O-';
    WHEN 'AB+' THEN SET compatible_groups = 'A+,A-,B+,B-,AB+,AB-,O+,O-'; -- Universal recipient
    WHEN 'AB-' THEN SET compatible_groups = 'A-,B-,AB-,O-';
    WHEN 'O+' THEN SET compatible_groups = 'O+,O-';
    WHEN 'O-' THEN SET compatible_groups = 'O-'; -- Can only receive O-
    ELSE SET compatible_groups = '';
  END CASE;
  
  -- Return compatible donors and available blood
  SELECT 
    d.DonorID,
    d.Name as DonorName,
    d.BloodGroup,
    d.Contact,
    b.BloodID,
    b.Quantity as AvailableUnits,
    bb.Name as BankName,
    'Compatible' as CompatibilityStatus
  FROM Donor d
  LEFT JOIN Blood b ON d.BloodGroup = b.BloodGroup
  LEFT JOIN BloodBank bb ON b.BankID = bb.BankID
  WHERE FIND_IN_SET(d.BloodGroup, compatible_groups) > 0
    AND b.Quantity > 0
  ORDER BY b.Quantity DESC, d.BloodGroup;
END$

/*
  PROCEDURE: GetInventoryReport
  PURPOSE: Generate comprehensive inventory report with low stock alerts
  PARAMETERS: None
  RETURNS: Complete inventory status with alerts
  
  WHY USED: Provides a single call to get complete inventory overview
  Includes business logic for determining stock levels and alerts
*/
DROP PROCEDURE IF EXISTS GetInventoryReport$
CREATE PROCEDURE GetInventoryReport()
BEGIN
  -- Blood inventory with stock level analysis
  SELECT 
    'BLOOD' as ItemType,
    b.BloodGroup as ItemName,
    b.Quantity,
    bb.Name as BankName,
    bb.Location,
    CASE 
      WHEN b.Quantity = 0 THEN 'CRITICAL - OUT OF STOCK'
      WHEN b.Quantity < 5 THEN 'CRITICAL - VERY LOW'
      WHEN b.Quantity < 10 THEN 'WARNING - LOW STOCK'
      WHEN b.Quantity < 20 THEN 'CAUTION - MODERATE'
      ELSE 'GOOD - ADEQUATE STOCK'
    END as StockStatus,
    CASE 
      WHEN b.Quantity < 10 THEN 'URGENT RESTOCKING NEEDED'
      WHEN b.Quantity < 20 THEN 'CONSIDER RESTOCKING'
      ELSE 'NO ACTION REQUIRED'
    END as RecommendedAction
  FROM Blood b
  LEFT JOIN BloodBank bb ON b.BankID = bb.BankID
  
  UNION ALL
  
  -- Organ inventory with availability analysis
  SELECT 
    'ORGAN' as ItemType,
    o.OrganType as ItemName,
    o.Quantity,
    ob.Name as BankName,
    ob.Location,
    CASE 
      WHEN o.Quantity = 0 THEN 'CRITICAL - NOT AVAILABLE'
      WHEN o.Quantity = 1 THEN 'CRITICAL - ONLY 1 AVAILABLE'
      WHEN o.Quantity < 3 THEN 'WARNING - LIMITED AVAILABILITY'
      ELSE 'GOOD - AVAILABLE'
    END as StockStatus,
    CASE 
      WHEN o.Quantity = 0 THEN 'URGENT - FIND DONORS'
      WHEN o.Quantity < 2 THEN 'HIGH PRIORITY - SEEK DONORS'
      ELSE 'MONITOR REGULARLY'
    END as RecommendedAction
  FROM Organ o
  LEFT JOIN OrganBank ob ON o.OrganBankID = ob.OrganBankID
  
  ORDER BY 
    CASE ItemType WHEN 'BLOOD' THEN 1 ELSE 2 END,
    Quantity ASC;
END$

/*
  PROCEDURE: GetDonorHistory
  PURPOSE: Get complete donation history for a specific donor
  PARAMETERS:
    - p_donor_id: Donor ID to get history for
  RETURNS: Complete donation history with details
  
  WHY USED: Provides comprehensive donor activity tracking
  Useful for donor recognition and medical history
*/
DROP PROCEDURE IF EXISTS GetDonorHistory$
CREATE PROCEDURE GetDonorHistory(IN p_donor_id INT)
BEGIN
  SELECT 
    dr.DonationID,
    dr.DonationDate,
    dr.Quantity,
    CASE 
      WHEN dr.BloodID IS NOT NULL THEN CONCAT(b.BloodGroup, ' Blood')
      WHEN dr.OrganID IS NOT NULL THEN CONCAT(o.OrganType, ' Organ')
      ELSE 'Unknown'
    END as DonationType,
    COALESCE(p.Name, 'General Pool') as RecipientPatient,
    COALESCE(bb.Name, ob.Name, 'Unknown') as BankName,
    dr.Notes,
    -- Calculate days since donation
    DATEDIFF(CURDATE(), dr.DonationDate) as DaysAgo
  FROM DonationRecord dr
  LEFT JOIN Blood b ON dr.BloodID = b.BloodID
  LEFT JOIN Organ o ON dr.OrganID = o.OrganID
  LEFT JOIN Patient p ON dr.PatientID = p.PatientID
  LEFT JOIN BloodBank bb ON dr.BankID = bb.BankID
  LEFT JOIN OrganBank ob ON o.OrganBankID = ob.OrganBankID
  WHERE dr.DonorID = p_donor_id
  ORDER BY dr.DonationDate DESC;
  
  -- Also return donor summary statistics
  SELECT 
    COUNT(*) as TotalDonations,
    SUM(dr.Quantity) as TotalQuantityDonated,
    MIN(dr.DonationDate) as FirstDonation,
    MAX(dr.DonationDate) as LastDonation,
    DATEDIFF(CURDATE(), MAX(dr.DonationDate)) as DaysSinceLastDonation
  FROM DonationRecord dr
  WHERE dr.DonorID = p_donor_id;
END$

/*
  PROCEDURE: GetCriticalPatients
  PURPOSE: Find patients who urgently need blood/organs based on intake date
  PARAMETERS: None
  RETURNS: List of patients prioritized by urgency
  
  WHY USED: Helps medical staff prioritize patient care
  Identifies patients who have been waiting longest
*/
DROP PROCEDURE IF EXISTS GetCriticalPatients$
CREATE PROCEDURE GetCriticalPatients()
BEGIN
  SELECT 
    p.PatientID,
    p.Name,
    p.BloodGroup,
    p.Contact,
    p.DateOfIntake,
    DATEDIFF(CURDATE(), p.DateOfIntake) as DaysWaiting,
    CASE 
      WHEN DATEDIFF(CURDATE(), p.DateOfIntake) > 30 THEN 'CRITICAL - 30+ DAYS'
      WHEN DATEDIFF(CURDATE(), p.DateOfIntake) > 14 THEN 'HIGH PRIORITY - 14+ DAYS'
      WHEN DATEDIFF(CURDATE(), p.DateOfIntake) > 7 THEN 'MODERATE PRIORITY - 7+ DAYS'
      ELSE 'RECENT INTAKE'
    END as PriorityLevel,
    -- Check if compatible blood is available
    (SELECT SUM(b.Quantity) 
     FROM Blood b 
     WHERE b.BloodGroup = p.BloodGroup OR 
           (p.BloodGroup = 'AB+') OR 
           (p.BloodGroup IN ('A+','B+','AB+','O+') AND b.BloodGroup = 'O+') OR
           (b.BloodGroup = 'O-')
    ) as CompatibleBloodUnits
  FROM Patient p
  ORDER BY DaysWaiting DESC, p.BloodGroup;
END$

DELIMITER ;