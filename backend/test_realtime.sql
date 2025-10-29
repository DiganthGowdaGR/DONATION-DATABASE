-- Real-time donation system test
USE donation_db;

-- Check current inventory
SELECT 'BEFORE DONATION' as Status, BloodGroup, Quantity FROM Blood WHERE BloodGroup IN ('A+', 'B+', 'O+');

-- Simulate donor giving A+ blood (this should INCREASE inventory)
-- In real system, this would be done through frontend donation form
UPDATE Blood SET Quantity = Quantity + 3 WHERE BloodGroup = 'A+';

-- Check inventory after donation received
SELECT 'AFTER RECEIVING DONATION' as Status, BloodGroup, Quantity FROM Blood WHERE BloodGroup IN ('A+', 'B+', 'O+');

-- Now simulate patient receiving A+ blood (this should DECREASE inventory via triggers)
INSERT INTO DonationRecord (DonationDate, Quantity, DonorID, PatientID, BloodID, BankID, Notes) 
VALUES (CURDATE(), 2, 2, 1, 2, 1, 'Patient receiving A+ blood');

-- Check inventory after patient received blood
SELECT 'AFTER PATIENT RECEIVED BLOOD' as Status, BloodGroup, Quantity FROM Blood WHERE BloodGroup IN ('A+', 'B+', 'O+');

-- Check audit logs to see trigger activity
SELECT 'AUDIT LOGS' as Status, EventTime, TableName, Action, Details 
FROM AuditLog 
ORDER BY EventTime DESC 
LIMIT 5;