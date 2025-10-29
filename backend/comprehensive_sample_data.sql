-- ================================
-- COMPREHENSIVE SAMPLE DATA (10+ RECORDS EACH TABLE)
-- All data interconnected across related tables
-- ================================
USE donation_db;

-- Clear existing data to start fresh
DELETE FROM DonationRecord;
DELETE FROM Blood;
DELETE FROM Organ;
DELETE FROM Donor;
DELETE FROM Patient;
DELETE FROM BloodBank;
DELETE FROM OrganBank;
DELETE FROM AuditLog;

-- Reset auto-increment counters
ALTER TABLE Donor AUTO_INCREMENT = 1;
ALTER TABLE Patient AUTO_INCREMENT = 1;
ALTER TABLE BloodBank AUTO_INCREMENT = 1;
ALTER TABLE OrganBank AUTO_INCREMENT = 1;
ALTER TABLE Blood AUTO_INCREMENT = 1;
ALTER TABLE Organ AUTO_INCREMENT = 1;
ALTER TABLE DonationRecord AUTO_INCREMENT = 1;
ALTER TABLE AuditLog AUTO_INCREMENT = 1;

-- ================================
-- 1. BLOOD BANKS (3 banks)
-- ================================
INSERT INTO BloodBank (Name, Location, Quantity) VALUES
('City Blood Bank', 'MG Road, Bangalore', 150),
('Green Health Bank', 'Koramangala, Bangalore', 120),
('Metro Blood Center', 'Whitefield, Bangalore', 100);

-- ================================
-- 2. ORGAN BANKS (2 banks)
-- ================================
INSERT INTO OrganBank (Name, Location) VALUES
('Central Organ Bank', 'Victoria Hospital, Bangalore'),
('Advanced Transplant Center', 'Manipal Hospital, Bangalore');

-- ================================
-- 3. DONORS (12 donors with diverse blood groups)
-- ================================
INSERT INTO Donor (Name, Age, Gender, BloodGroup, Address, Contact, Disease) VALUES
('Rajesh Kumar', 28, 'M', 'O+', 'MG Road, Bangalore', '9876543210', 'None'),
('Priya Sharma', 32, 'F', 'A+', 'Koramangala, Bangalore', '9876543211', 'None'),
('Amit Singh', 25, 'M', 'B+', 'Indiranagar, Bangalore', '9876543212', 'Hypertension'),
('Sneha Patel', 29, 'F', 'AB+', 'Whitefield, Bangalore', '9876543213', 'None'),
('Vikram Reddy', 35, 'M', 'O-', 'HSR Layout, Bangalore', '9876543214', 'Diabetes'),
('Kavya Nair', 26, 'F', 'A-', 'Jayanagar, Bangalore', '9876543215', 'None'),
('Rohit Gupta', 31, 'M', 'B-', 'BTM Layout, Bangalore', '9876543216', 'None'),
('Meera Joshi', 27, 'F', 'AB-', 'Electronic City, Bangalore', '9876543217', 'Asthma'),
('Kiran Rao', 33, 'M', 'O+', 'Marathahalli, Bangalore', '9876543218', 'None'),
('Deepika Iyer', 24, 'F', 'A+', 'Sarjapur, Bangalore', '9876543219', 'None'),
('Suresh Babu', 40, 'M', 'B+', 'Banashankari, Bangalore', '9876543220', 'None'),
('Anitha Reddy', 30, 'F', 'O-', 'Hebbal, Bangalore', '9876543221', 'None');

-- ================================
-- 4. PATIENTS (12 patients needing different blood types)
-- ================================
INSERT INTO Patient (Name, Age, Gender, BloodGroup, Address, Contact, DateOfIntake) VALUES
('Arjun Mehta', 45, 'M', 'O+', 'Richmond Road, Bangalore', '9123456780', '2025-09-01'),
('Lakshmi Devi', 38, 'F', 'A+', 'Malleshwaram, Bangalore', '9123456781', '2025-09-15'),
('Suresh Kumar', 52, 'M', 'B+', 'Basavanagudi, Bangalore', '9123456782', '2025-10-01'),
('Anita Rao', 41, 'F', 'AB+', 'Rajajinagar, Bangalore', '9123456783', '2025-10-05'),
('Manoj Kumar', 36, 'M', 'O-', 'Vijayanagar, Bangalore', '9123456784', '2025-10-10'),
('Sunita Singh', 43, 'F', 'A-', 'Yeshwanthpur, Bangalore', '9123456785', '2025-10-15'),
('Ravi Chandra', 39, 'M', 'B-', 'Peenya, Bangalore', '9123456786', '2025-10-18'),
('Geetha Kumari', 47, 'F', 'AB-', 'Hebbal, Bangalore', '9123456787', '2025-10-20'),
('Naveen Reddy', 34, 'M', 'O+', 'Yelahanka, Bangalore', '9123456788', '2025-10-22'),
('Pooja Agarwal', 29, 'F', 'A+', 'Banashankari, Bangalore', '9123456789', '2025-10-25'),
('Ramesh Gowda', 48, 'M', 'B+', 'JP Nagar, Bangalore', '9123456790', '2025-10-26'),
('Shanti Devi', 55, 'F', 'O-', 'RT Nagar, Bangalore', '9123456791', '2025-10-27');

-- ================================
-- 5. BLOOD INVENTORY (All 8 blood groups across 3 banks)
-- ================================
INSERT INTO Blood (BloodGroup, Quantity, BankID) VALUES
-- City Blood Bank (BankID = 1)
('A+', 25, 1), ('A-', 15, 1), ('B+', 30, 1), ('B-', 12, 1),
('AB+', 8, 1), ('AB-', 5, 1), ('O+', 35, 1), ('O-', 20, 1),
-- Green Health Bank (BankID = 2)
('A+', 20, 2), ('A-', 10, 2), ('B+', 25, 2), ('B-', 8, 2),
('AB+', 6, 2), ('AB-', 3, 2), ('O+', 30, 2), ('O-', 15, 2),
-- Metro Blood Center (BankID = 3)
('A+', 18, 3), ('A-', 12, 3), ('B+', 22, 3), ('B-', 10, 3),
('AB+', 7, 3), ('AB-', 4, 3), ('O+', 28, 3), ('O-', 18, 3);

-- ================================
-- 6. ORGAN INVENTORY (Multiple organs across 2 banks)
-- ================================
INSERT INTO Organ (OrganType, OrganCondition, OrganBankID, Quantity) VALUES
-- Central Organ Bank (OrganBankID = 1)
('Heart', 'Excellent', 1, 2),
('Liver', 'Good', 1, 4),
('Kidney', 'Excellent', 1, 8),
('Lung', 'Good', 1, 3),
('Pancreas', 'Fair', 1, 1),
('Cornea', 'Excellent', 1, 12),
('Bone', 'Good', 1, 20),
-- Advanced Transplant Center (OrganBankID = 2)
('Heart', 'Good', 2, 1),
('Liver', 'Excellent', 2, 3),
('Kidney', 'Good', 2, 6),
('Lung', 'Excellent', 2, 2),
('Cornea', 'Good', 2, 8),
('Bone', 'Excellent', 2, 15);

-- ================================
-- 7. DONATION RECORDS (15+ donations showing all relationships)
-- ================================

-- Blood donations (donors giving blood - ADDS to inventory)
INSERT INTO DonationRecord (DonationDate, Quantity, DonorID, PatientID, BloodID, OrganID, BankID, Notes) VALUES
('2025-10-01', 2, 1, NULL, 7, NULL, 1, 'Rajesh donated O+ blood to City Blood Bank'),
('2025-10-02', 1, 2, NULL, 1, NULL, 1, 'Priya donated A+ blood to City Blood Bank'),
('2025-10-03', 3, 3, NULL, 3, NULL, 1, 'Amit donated B+ blood to City Blood Bank'),
('2025-10-04', 1, 4, NULL, 5, NULL, 1, 'Sneha donated AB+ blood to City Blood Bank'),
('2025-10-05', 2, 5, NULL, 8, NULL, 1, 'Vikram donated O- blood to City Blood Bank'),
('2025-10-06', 1, 6, NULL, 2, NULL, 1, 'Kavya donated A- blood to City Blood Bank'),
('2025-10-07', 2, 9, NULL, 15, NULL, 2, 'Kiran donated O+ blood to Green Health Bank'),
('2025-10-08', 1, 10, NULL, 9, NULL, 2, 'Deepika donated A+ blood to Green Health Bank'),

-- Organ donations (donors giving organs - ADDS to inventory)
('2025-10-10', 1, 7, NULL, NULL, 3, NULL, 'Rohit donated kidney to Central Organ Bank'),
('2025-10-12', 1, 8, NULL, NULL, 6, NULL, 'Meera donated cornea to Central Organ Bank'),
('2025-10-14', 2, 11, NULL, NULL, 7, NULL, 'Suresh donated bone to Central Organ Bank'),
('2025-10-16', 1, 12, NULL, NULL, 12, NULL, 'Anitha donated cornea to Advanced Transplant Center'),

-- Patient receiving blood (SUBTRACTS from inventory)
('2025-10-18', 2, NULL, 1, 7, NULL, 1, 'Arjun received O+ blood from City Blood Bank'),
('2025-10-20', 1, NULL, 2, 1, NULL, 1, 'Lakshmi received A+ blood from City Blood Bank'),
('2025-10-22', 3, NULL, 3, 3, NULL, 1, 'Suresh Kumar received B+ blood from City Blood Bank'),

-- Patient receiving organs (SUBTRACTS from inventory)
('2025-10-24', 1, NULL, 5, NULL, 3, NULL, 'Manoj received kidney from Central Organ Bank'),
('2025-10-26', 1, NULL, 8, NULL, 6, NULL, 'Geetha received cornea from Central Organ Bank');

-- ================================
-- VERIFICATION QUERIES
-- ================================
SELECT 'DATA INSERTION COMPLETED' as Status;

SELECT 'DONORS' as TableName, COUNT(*) as RecordCount FROM Donor
UNION ALL SELECT 'PATIENTS', COUNT(*) FROM Patient
UNION ALL SELECT 'BLOOD_BANKS', COUNT(*) FROM BloodBank
UNION ALL SELECT 'ORGAN_BANKS', COUNT(*) FROM OrganBank
UNION ALL SELECT 'BLOOD_INVENTORY', COUNT(*) FROM Blood
UNION ALL SELECT 'ORGAN_INVENTORY', COUNT(*) FROM Organ
UNION ALL SELECT 'DONATIONS', COUNT(*) FROM DonationRecord
UNION ALL SELECT 'AUDIT_LOGS', COUNT(*) FROM AuditLog;

-- Show sample data from each table
SELECT 'SAMPLE DONORS' as Info, Name, BloodGroup, Contact FROM Donor LIMIT 5;
SELECT 'SAMPLE PATIENTS' as Info, Name, BloodGroup, DateOfIntake FROM Patient LIMIT 5;
SELECT 'SAMPLE BLOOD INVENTORY' as Info, BloodGroup, Quantity, (SELECT Name FROM BloodBank WHERE BankID = Blood.BankID) as BankName FROM Blood LIMIT 8;
SELECT 'SAMPLE DONATIONS' as Info, DonationDate, Quantity, Notes FROM DonationRecord LIMIT 5;