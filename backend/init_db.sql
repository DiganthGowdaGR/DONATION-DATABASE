-- ================================
-- CLEAN START: drop and recreate DB
-- ================================
DROP DATABASE IF EXISTS donation_db;
CREATE DATABASE donation_db;
USE donation_db;

-- ================================
-- SCHEMA
-- ================================

-- REMOVED: Team table (not used by application)

-- 2) Donor
CREATE TABLE Donor (
  DonorID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(120) NOT NULL,
  Age INT,
  Gender ENUM('M','F','Other'),
  BloodGroup VARCHAR(5),
  Address VARCHAR(255),
  Contact VARCHAR(20),
  Disease VARCHAR(255)
) ENGINE=InnoDB;

-- 3) Patient
CREATE TABLE Patient (
  PatientID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(120) NOT NULL,
  Age INT,
  Gender ENUM('M','F','Other'),
  BloodGroup VARCHAR(5),
  Address VARCHAR(255),
  Contact VARCHAR(20),
  DateOfIntake DATE
) ENGINE=InnoDB;

-- 4) BloodBank (parent for Blood)  << create BEFORE Blood
CREATE TABLE BloodBank (
  BankID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(150) NOT NULL,
  Location VARCHAR(255),
  Quantity INT DEFAULT 0
) ENGINE=InnoDB;

-- 5) Blood (references BloodBank)
CREATE TABLE Blood (
  BloodID INT AUTO_INCREMENT PRIMARY KEY,
  BloodGroup VARCHAR(5) NOT NULL,
  Quantity INT NOT NULL DEFAULT 0,
  BankID INT,
  CONSTRAINT fk_blood_bank FOREIGN KEY (BankID) REFERENCES BloodBank(BankID) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 6) OrganBank (parent for Organ)
CREATE TABLE OrganBank (
  OrganBankID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(150) NOT NULL,
  Location VARCHAR(255)
) ENGINE=InnoDB;

-- 7) Organ (references OrganBank)
CREATE TABLE Organ (
  OrganID INT AUTO_INCREMENT PRIMARY KEY,
  OrganType VARCHAR(100) NOT NULL,
  OrganCondition VARCHAR(100),
  OrganBankID INT,
  Quantity INT DEFAULT 0,
  CONSTRAINT fk_organbank FOREIGN KEY (OrganBankID) REFERENCES OrganBank(OrganBankID) ON DELETE SET NULL
) ENGINE=InnoDB;

-- REMOVED: Manager and Hospital tables (not used by application)

-- 8) DonationRecord (references many tables)
CREATE TABLE DonationRecord (
  DonationID INT AUTO_INCREMENT PRIMARY KEY,
  DonationDate DATE NOT NULL,
  Quantity INT DEFAULT 0,
  OrganType VARCHAR(100),
  DonorID INT,
  PatientID INT,
  BloodID INT,
  OrganID INT,
  BankID INT,
  Notes TEXT,
  CONSTRAINT fk_donation_donor FOREIGN KEY (DonorID) REFERENCES Donor(DonorID) ON DELETE SET NULL,
  CONSTRAINT fk_donation_patient FOREIGN KEY (PatientID) REFERENCES Patient(PatientID) ON DELETE SET NULL,
  CONSTRAINT fk_donation_blood FOREIGN KEY (BloodID) REFERENCES Blood(BloodID) ON DELETE SET NULL,
  CONSTRAINT fk_donation_organ FOREIGN KEY (OrganID) REFERENCES Organ(OrganID) ON DELETE SET NULL,
  CONSTRAINT fk_donation_bank FOREIGN KEY (BankID) REFERENCES BloodBank(BankID) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 9) AuditLog
CREATE TABLE AuditLog (
  AuditID INT AUTO_INCREMENT PRIMARY KEY,
  EventTime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  TableName VARCHAR(100),
  Action VARCHAR(20),
  KeyValue VARCHAR(255),
  UserName VARCHAR(100),
  Details TEXT
) ENGINE=InnoDB;

-- ================================
-- TRIGGERS (minimal, clear, safe)
-- ================================
DELIMITER $$

/*
  BEFORE INSERT on DonationRecord
  - Validate there is enough stock for blood and/or organ (if provided).
  - If not enough, throw an error to stop the insert.
*/
CREATE TRIGGER trg_donation_before_insert
BEFORE INSERT ON DonationRecord
FOR EACH ROW
BEGIN
  DECLARE v_blood_qty INT DEFAULT NULL;
  DECLARE v_organ_qty INT DEFAULT NULL;

  -- If a BloodID is provided and quantity > 0, check blood stock
  IF NEW.BloodID IS NOT NULL AND NEW.Quantity > 0 THEN
    SELECT Quantity INTO v_blood_qty FROM Blood WHERE BloodID = NEW.BloodID;
    IF v_blood_qty IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Blood record not found for provided BloodID';
    ELSEIF v_blood_qty < NEW.Quantity THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient blood stock for this donation';
    END IF;
  END IF;

  -- If an OrganID is provided and quantity > 0, check organ stock
  IF NEW.OrganID IS NOT NULL AND NEW.Quantity > 0 THEN
    SELECT Quantity INTO v_organ_qty FROM Organ WHERE OrganID = NEW.OrganID;
    IF v_organ_qty IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Organ record not found for provided OrganID';
    ELSEIF v_organ_qty < NEW.Quantity THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient organ stock for this donation';
    END IF;
  END IF;
END$$

/*
  AFTER INSERT on DonationRecord
  - Decrement the corresponding Blood and/or Organ quantities.
  - Also decrement the parent BloodBank.Quantity for blood donations (if BankID provided).
  - Create simple audit log entries describing what was changed.
*/
CREATE TRIGGER trg_donation_after_insert
AFTER INSERT ON DonationRecord
FOR EACH ROW
BEGIN
  -- Update blood stock if BloodID present
  IF NEW.BloodID IS NOT NULL AND NEW.Quantity > 0 THEN
    UPDATE Blood
    SET Quantity = Quantity - NEW.Quantity
    WHERE BloodID = NEW.BloodID;

    -- Update the bank-level aggregate (if BankID provided)
    IF NEW.BankID IS NOT NULL THEN
      UPDATE BloodBank
      SET Quantity = Quantity - NEW.Quantity
      WHERE BankID = NEW.BankID;
    END IF;

    INSERT INTO AuditLog (TableName, Action, KeyValue, UserName, Details)
    VALUES ('Blood', 'UPDATE', CONCAT('BloodID=', NEW.BloodID), COALESCE(NEW.DonorID, 'system'),
            CONCAT('Decremented blood by ', NEW.Quantity, ' due to DonationID=', NEW.DonationID));
  END IF;

  -- Update organ stock if OrganID present
  IF NEW.OrganID IS NOT NULL AND NEW.Quantity > 0 THEN
    UPDATE Organ
    SET Quantity = Quantity - NEW.Quantity
    WHERE OrganID = NEW.OrganID;

    INSERT INTO AuditLog (TableName, Action, KeyValue, UserName, Details)
    VALUES ('Organ', 'UPDATE', CONCAT('OrganID=', NEW.OrganID), COALESCE(NEW.DonorID, 'system'),
            CONCAT('Decremented organ by ', NEW.Quantity, ' due to DonationID=', NEW.DonationID));
  END IF;

  -- Log creation of DonationRecord
  INSERT INTO AuditLog (TableName, Action, KeyValue, UserName, Details)
  VALUES ('DonationRecord', 'INSERT', CONCAT('DonationID=', NEW.DonationID), COALESCE(NEW.DonorID, 'system'),
          CONCAT('Inserted donation record on ', NEW.DonationDate));
END$$

/*
  AFTER DELETE on DonationRecord
  - Restore quantities for blood/organ when a donation record is removed.
  - Useful for rollback / admin delete cases.
*/
CREATE TRIGGER trg_donation_after_delete
AFTER DELETE ON DonationRecord
FOR EACH ROW
BEGIN
  -- Restore blood stock
  IF OLD.BloodID IS NOT NULL AND OLD.Quantity > 0 THEN
    UPDATE Blood
    SET Quantity = Quantity + OLD.Quantity
    WHERE BloodID = OLD.BloodID;

    IF OLD.BankID IS NOT NULL THEN
      UPDATE BloodBank
      SET Quantity = Quantity + OLD.Quantity
      WHERE BankID = OLD.BankID;
    END IF;

    INSERT INTO AuditLog (TableName, Action, KeyValue, UserName, Details)
    VALUES ('Blood', 'UPDATE', CONCAT('BloodID=', OLD.BloodID), COALESCE(OLD.DonorID, 'system'),
            CONCAT('Restored blood by ', OLD.Quantity, ' due to deletion of DonationID=', OLD.DonationID));
  END IF;

  -- Restore organ stock
  IF OLD.OrganID IS NOT NULL AND OLD.Quantity > 0 THEN
    UPDATE Organ
    SET Quantity = Quantity + OLD.Quantity
    WHERE OrganID = OLD.OrganID;

    INSERT INTO AuditLog (TableName, Action, KeyValue, UserName, Details)
    VALUES ('Organ', 'UPDATE', CONCAT('OrganID=', OLD.OrganID), COALESCE(OLD.DonorID, 'system'),
            CONCAT('Restored organ by ', OLD.Quantity, ' due to deletion of DonationID=', OLD.DonationID));
  END IF;

  -- Log deletion of DonationRecord
  INSERT INTO AuditLog (TableName, Action, KeyValue, UserName, Details)
  VALUES ('DonationRecord', 'DELETE', CONCAT('DonationID=', OLD.DonationID), COALESCE(OLD.DonorID, 'system'),
          CONCAT('Deleted donation record originally on ', OLD.DonationDate));
END$$

DELIMITER ;

-- ================================
-- STORED PROCEDURES
-- ================================
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
  PROCEDURE: ProcessDonation
  PURPOSE: Safely process a donation with validation and error handling
  PARAMETERS:
    - p_donor_id: Donor ID (optional)
    - p_patient_id: Patient ID (optional) 
    - p_blood_id: Blood record ID (optional)
    - p_organ_id: Organ record ID (optional)
    - p_quantity: Quantity to donate
    - p_notes: Additional notes
  RETURNS: Success/failure status with detailed messages
  
  WHY USED: Encapsulates complex donation logic with proper validation
  Provides better error handling than direct INSERT statements
*/
CREATE PROCEDURE ProcessDonation(
  IN p_donor_id INT,
  IN p_patient_id INT,
  IN p_blood_id INT,
  IN p_organ_id INT,
  IN p_quantity INT,
  IN p_notes TEXT,
  OUT p_result_code INT,
  OUT p_result_message TEXT
)
BEGIN
  DECLARE v_blood_available INT DEFAULT 0;
  DECLARE v_organ_available INT DEFAULT 0;
  DECLARE v_donation_id INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    GET DIAGNOSTICS CONDITION 1
      p_result_code = MYSQL_ERRNO,
      p_result_message = MESSAGE_TEXT;
  END;
  
  START TRANSACTION;
  
  -- Validation: Must have either blood or organ
  IF p_blood_id IS NULL AND p_organ_id IS NULL THEN
    SET p_result_code = 1001;
    SET p_result_message = 'ERROR: Must specify either Blood ID or Organ ID';
    ROLLBACK;
  ELSE
    -- Validate blood availability if blood donation
    IF p_blood_id IS NOT NULL THEN
      SELECT Quantity INTO v_blood_available 
      FROM Blood WHERE BloodID = p_blood_id;
      
      IF v_blood_available < p_quantity THEN
        SET p_result_code = 1002;
        SET p_result_message = CONCAT('ERROR: Insufficient blood stock. Available: ', v_blood_available, ', Requested: ', p_quantity);
        ROLLBACK;
      END IF;
    END IF;
    
    -- Validate organ availability if organ donation
    IF p_organ_id IS NOT NULL THEN
      SELECT Quantity INTO v_organ_available 
      FROM Organ WHERE OrganID = p_organ_id;
      
      IF v_organ_available < p_quantity THEN
        SET p_result_code = 1003;
        SET p_result_message = CONCAT('ERROR: Insufficient organ stock. Available: ', v_organ_available, ', Requested: ', p_quantity);
        ROLLBACK;
      END IF;
    END IF;
    
    -- If validation passed, insert donation record
    INSERT INTO DonationRecord (
      DonationDate, Quantity, DonorID, PatientID, BloodID, OrganID, Notes
    ) VALUES (
      CURDATE(), p_quantity, p_donor_id, p_patient_id, p_blood_id, p_organ_id, p_notes
    );
    
    SET v_donation_id = LAST_INSERT_ID();
    SET p_result_code = 0;
    SET p_result_message = CONCAT('SUCCESS: Donation recorded with ID ', v_donation_id, '. Inventory updated automatically.');
    
    COMMIT;
  END IF;
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

-- ================================
-- SAMPLE SEED DATA
-- ================================
-- REMOVED: Team sample data (table not used)

INSERT INTO BloodBank (Name, Location, Quantity) VALUES ('City Blood Bank', 'Bangalore', 100), ('Green Health Bank', 'Mysore', 50);
INSERT INTO OrganBank (Name, Location) VALUES ('Central Organ Bank', 'Bangalore');

INSERT INTO Donor (Name, Age, Gender, BloodGroup, Address, Contact, Disease)
VALUES ('Ashok', 29, 'M', 'B+', 'Koramangala', '9876543210', 'None');

INSERT INTO Patient (Name, Age, Gender, BloodGroup, Address, Contact, DateOfIntake)
VALUES ('Suresh', 45, 'M', 'B+', 'Indiranagar', '9123456780', '2025-10-01');

INSERT INTO Blood (BloodGroup, Quantity, BankID)
VALUES ('B+', 20, (SELECT BankID FROM BloodBank WHERE Name='City Blood Bank' LIMIT 1));

INSERT INTO Organ (OrganType, OrganCondition, OrganBankID, Quantity)
VALUES ('Kidney', 'Good', (SELECT OrganBankID FROM OrganBank WHERE Name='Central Organ Bank' LIMIT 1), 2);

-- ================================
-- QUICK VERIFICATION QUERIES
-- ================================
SHOW TABLES;
SELECT DATABASE();
SELECT * FROM BloodBank;
SELECT * FROM Blood;
SELECT * FROM Organ;
SELECT * FROM Donor LIMIT 5;
SELECT * FROM Patient LIMIT 5;
SELECT * FROM AuditLog LIMIT 10;
