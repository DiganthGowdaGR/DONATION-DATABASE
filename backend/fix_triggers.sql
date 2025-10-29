USE donation_db;

-- Drop existing triggers
DROP TRIGGER IF EXISTS trg_donation_before_insert;
DROP TRIGGER IF EXISTS trg_donation_after_insert;
DROP TRIGGER IF EXISTS trg_donation_after_delete;

DELIMITER $

/*
  UPDATED BEFORE INSERT TRIGGER
  - If DonorID is provided (donor giving), allow donation (will ADD to inventory)
  - If PatientID is provided (patient receiving), check if enough stock exists
*/
CREATE TRIGGER trg_donation_before_insert
BEFORE INSERT ON DonationRecord
FOR EACH ROW
BEGIN
  DECLARE v_blood_qty INT DEFAULT NULL;
  DECLARE v_organ_qty INT DEFAULT NULL;

  -- Only check stock if this is for a PATIENT (taking from inventory)
  -- If DonorID is provided without PatientID, this is a donor GIVING (adding to inventory)
  IF NEW.PatientID IS NOT NULL THEN
    -- This is a patient receiving blood/organ, check if enough stock
    IF NEW.BloodID IS NOT NULL AND NEW.Quantity > 0 THEN
      SELECT Quantity INTO v_blood_qty FROM Blood WHERE BloodID = NEW.BloodID;
      IF v_blood_qty IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Blood record not found for provided BloodID';
      ELSEIF v_blood_qty < NEW.Quantity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient blood stock for patient';
      END IF;
    END IF;

    IF NEW.OrganID IS NOT NULL AND NEW.Quantity > 0 THEN
      SELECT Quantity INTO v_organ_qty FROM Organ WHERE OrganID = NEW.OrganID;
      IF v_organ_qty IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Organ record not found for provided OrganID';
      ELSEIF v_organ_qty < NEW.Quantity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient organ stock for patient';
      END IF;
    END IF;
  END IF;
  -- If only DonorID is provided (no PatientID), this is a donation - no stock check needed
END$

/*
  UPDATED AFTER INSERT TRIGGER
  - If DonorID only: ADD to inventory (donor giving)
  - If PatientID: SUBTRACT from inventory (patient receiving)
  - If both: This is a direct transfer, subtract from inventory
*/
CREATE TRIGGER trg_donation_after_insert
AFTER INSERT ON DonationRecord
FOR EACH ROW
BEGIN
  DECLARE is_donor_giving BOOLEAN DEFAULT FALSE;
  DECLARE is_patient_receiving BOOLEAN DEFAULT FALSE;
  
  -- Determine the type of transaction
  SET is_donor_giving = (NEW.DonorID IS NOT NULL AND NEW.PatientID IS NULL);
  SET is_patient_receiving = (NEW.PatientID IS NOT NULL);

  -- Handle blood transactions
  IF NEW.BloodID IS NOT NULL AND NEW.Quantity > 0 THEN
    IF is_donor_giving THEN
      -- Donor giving blood - ADD to inventory
      UPDATE Blood SET Quantity = Quantity + NEW.Quantity WHERE BloodID = NEW.BloodID;
      
      IF NEW.BankID IS NOT NULL THEN
        UPDATE BloodBank SET Quantity = Quantity + NEW.Quantity WHERE BankID = NEW.BankID;
      END IF;
      
      INSERT INTO AuditLog (TableName, Action, KeyValue, UserName, Details)
      VALUES ('Blood', 'UPDATE', CONCAT('BloodID=', NEW.BloodID), COALESCE(NEW.DonorID, 'system'),
              CONCAT('Added ', NEW.Quantity, ' units from donor donation, DonationID=', NEW.DonationID));
              
    ELSEIF is_patient_receiving THEN
      -- Patient receiving blood - SUBTRACT from inventory
      UPDATE Blood SET Quantity = Quantity - NEW.Quantity WHERE BloodID = NEW.BloodID;
      
      IF NEW.BankID IS NOT NULL THEN
        UPDATE BloodBank SET Quantity = Quantity - NEW.Quantity WHERE BankID = NEW.BankID;
      END IF;
      
      INSERT INTO AuditLog (TableName, Action, KeyValue, UserName, Details)
      VALUES ('Blood', 'UPDATE', CONCAT('BloodID=', NEW.BloodID), COALESCE(NEW.PatientID, 'system'),
              CONCAT('Subtracted ', NEW.Quantity, ' units for patient, DonationID=', NEW.DonationID));
    END IF;
  END IF;

  -- Handle organ transactions
  IF NEW.OrganID IS NOT NULL AND NEW.Quantity > 0 THEN
    IF is_donor_giving THEN
      -- Donor giving organ - ADD to inventory
      UPDATE Organ SET Quantity = Quantity + NEW.Quantity WHERE OrganID = NEW.OrganID;
      
      INSERT INTO AuditLog (TableName, Action, KeyValue, UserName, Details)
      VALUES ('Organ', 'UPDATE', CONCAT('OrganID=', NEW.OrganID), COALESCE(NEW.DonorID, 'system'),
              CONCAT('Added ', NEW.Quantity, ' organs from donor donation, DonationID=', NEW.DonationID));
              
    ELSEIF is_patient_receiving THEN
      -- Patient receiving organ - SUBTRACT from inventory
      UPDATE Organ SET Quantity = Quantity - NEW.Quantity WHERE OrganID = NEW.OrganID;
      
      INSERT INTO AuditLog (TableName, Action, KeyValue, UserName, Details)
      VALUES ('Organ', 'UPDATE', CONCAT('OrganID=', NEW.OrganID), COALESCE(NEW.PatientID, 'system'),
              CONCAT('Subtracted ', NEW.Quantity, ' organs for patient, DonationID=', NEW.DonationID));
    END IF;
  END IF;

  -- Log the donation record creation
  INSERT INTO AuditLog (TableName, Action, KeyValue, UserName, Details)
  VALUES ('DonationRecord', 'INSERT', CONCAT('DonationID=', NEW.DonationID), 
          COALESCE(NEW.DonorID, NEW.PatientID, 'system'),
          CONCAT('Created donation record on ', NEW.DonationDate, 
                 CASE 
                   WHEN is_donor_giving THEN ' (Donor Giving)'
                   WHEN is_patient_receiving THEN ' (Patient Receiving)'
                   ELSE ' (Transfer)'
                 END));
END$

/*
  UPDATED AFTER DELETE TRIGGER
  - Reverse the inventory changes when donation is deleted
*/
CREATE TRIGGER trg_donation_after_delete
AFTER DELETE ON DonationRecord
FOR EACH ROW
BEGIN
  DECLARE was_donor_giving BOOLEAN DEFAULT FALSE;
  DECLARE was_patient_receiving BOOLEAN DEFAULT FALSE;
  
  -- Determine what type of transaction this was
  SET was_donor_giving = (OLD.DonorID IS NOT NULL AND OLD.PatientID IS NULL);
  SET was_patient_receiving = (OLD.PatientID IS NOT NULL);

  -- Reverse blood transactions
  IF OLD.BloodID IS NOT NULL AND OLD.Quantity > 0 THEN
    IF was_donor_giving THEN
      -- Was donor giving, so SUBTRACT to reverse the addition
      UPDATE Blood SET Quantity = Quantity - OLD.Quantity WHERE BloodID = OLD.BloodID;
      
      IF OLD.BankID IS NOT NULL THEN
        UPDATE BloodBank SET Quantity = Quantity - OLD.Quantity WHERE BankID = OLD.BankID;
      END IF;
      
    ELSEIF was_patient_receiving THEN
      -- Was patient receiving, so ADD to reverse the subtraction
      UPDATE Blood SET Quantity = Quantity + OLD.Quantity WHERE BloodID = OLD.BloodID;
      
      IF OLD.BankID IS NOT NULL THEN
        UPDATE BloodBank SET Quantity = Quantity + OLD.Quantity WHERE BankID = OLD.BankID;
      END IF;
    END IF;

    INSERT INTO AuditLog (TableName, Action, KeyValue, UserName, Details)
    VALUES ('Blood', 'UPDATE', CONCAT('BloodID=', OLD.BloodID), COALESCE(OLD.DonorID, OLD.PatientID, 'system'),
            CONCAT('Reversed blood transaction by ', OLD.Quantity, ' due to deletion of DonationID=', OLD.DonationID));
  END IF;

  -- Reverse organ transactions
  IF OLD.OrganID IS NOT NULL AND OLD.Quantity > 0 THEN
    IF was_donor_giving THEN
      -- Was donor giving, so SUBTRACT to reverse the addition
      UPDATE Organ SET Quantity = Quantity - OLD.Quantity WHERE OrganID = OLD.OrganID;
      
    ELSEIF was_patient_receiving THEN
      -- Was patient receiving, so ADD to reverse the subtraction
      UPDATE Organ SET Quantity = Quantity + OLD.Quantity WHERE OrganID = OLD.OrganID;
    END IF;

    INSERT INTO AuditLog (TableName, Action, KeyValue, UserName, Details)
    VALUES ('Organ', 'UPDATE', CONCAT('OrganID=', OLD.OrganID), COALESCE(OLD.DonorID, OLD.PatientID, 'system'),
            CONCAT('Reversed organ transaction by ', OLD.Quantity, ' due to deletion of DonationID=', OLD.DonationID));
  END IF;

  -- Log deletion
  INSERT INTO AuditLog (TableName, Action, KeyValue, UserName, Details)
  VALUES ('DonationRecord', 'DELETE', CONCAT('DonationID=', OLD.DonationID), 
          COALESCE(OLD.DonorID, OLD.PatientID, 'system'),
          CONCAT('Deleted donation record originally on ', OLD.DonationDate));
END$

DELIMITER ;