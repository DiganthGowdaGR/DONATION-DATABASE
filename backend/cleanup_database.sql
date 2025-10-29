-- ================================
-- CLEANUP UNUSED TABLES
-- ================================
USE donation_db;

-- Drop unused tables that are not integrated with the application
DROP TABLE IF EXISTS Manager;
DROP TABLE IF EXISTS Hospital;
DROP TABLE IF EXISTS Team;

-- Show remaining tables
SHOW TABLES;

-- Verify the core working tables have data
SELECT 'WORKING TABLES - DATA COUNT' as Status;
SELECT 'Donor' as TableName, COUNT(*) as Records FROM Donor
UNION ALL SELECT 'Patient', COUNT(*) FROM Patient
UNION ALL SELECT 'Blood', COUNT(*) FROM Blood
UNION ALL SELECT 'BloodBank', COUNT(*) FROM BloodBank
UNION ALL SELECT 'Organ', COUNT(*) FROM Organ
UNION ALL SELECT 'OrganBank', COUNT(*) FROM OrganBank
UNION ALL SELECT 'DonationRecord', COUNT(*) FROM DonationRecord
UNION ALL SELECT 'AuditLog', COUNT(*) FROM AuditLog;