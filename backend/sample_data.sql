USE donation_db;

-- Add more donors (10 total)
INSERT INTO Donor (Name, Age, Gender, BloodGroup, Address, Contact, Disease) VALUES
('Rajesh Kumar', 28, 'M', 'O+', 'MG Road, Bangalore', '9876543210', 'None'),
('Priya Sharma', 32, 'F', 'A+', 'Koramangala, Bangalore', '9876543211', 'None'),
('Amit Singh', 25, 'M', 'B+', 'Indiranagar, Bangalore', '9876543212', 'Hypertension'),
('Sneha Patel', 29, 'F', 'AB+', 'Whitefield, Bangalore', '9876543213', 'None'),
('Vikram Reddy', 35, 'M', 'O-', 'HSR Layout, Bangalore', '9876543214', 'Diabetes'),
('Kavya Nair', 26, 'F', 'A-', 'Jayanagar, Bangalore', '9876543215', 'None'),
('Rohit Gupta', 31, 'M', 'B-', 'BTM Layout, Bangalore', '9876543216', 'None'),
('Meera Joshi', 27, 'F', 'AB-', 'Electronic City, Bangalore', '9876543217', 'Asthma'),
('Kiran Rao', 33, 'M', 'O+', 'Marathahalli, Bangalore', '9876543218', 'None');

-- Add more patients (10 total)
INSERT INTO Patient (Name, Age, Gender, BloodGroup, Address, Contact, DateOfIntake) VALUES
('Arjun Mehta', 45, 'M', 'O+', 'Richmond Road, Bangalore', '9123456780', '2025-09-01'),
('Lakshmi Devi', 38, 'F', 'A+', 'Malleshwaram, Bangalore', '9123456781', '2025-09-15'),
('Suresh Babu', 52, 'M', 'B+', 'Basavanagudi, Bangalore', '9123456782', '2025-10-01'),
('Anita Rao', 41, 'F', 'AB+', 'Rajajinagar, Bangalore', '9123456783', '2025-10-05'),
('Manoj Kumar', 36, 'M', 'O-', 'Vijayanagar, Bangalore', '9123456784', '2025-10-10'),
('Sunita Singh', 43, 'F', 'A-', 'Yeshwanthpur, Bangalore', '9123456785', '2025-10-15'),
('Ravi Chandra', 39, 'M', 'B-', 'Peenya, Bangalore', '9123456786', '2025-10-18'),
('Geetha Kumari', 47, 'F', 'AB-', 'Hebbal, Bangalore', '9123456787', '2025-10-20'),
('Naveen Reddy', 34, 'M', 'O+', 'Yelahanka, Bangalore', '9123456788', '2025-10-22');

-- Add more donation records with various dates
INSERT INTO DonationRecord (DonationDate, Quantity, OrganType, DonorID, PatientID, BloodID, OrganID, BankID, Notes) VALUES
('2025-10-01', 2, NULL, 2, 1, 1, NULL, 1, 'Regular blood donation'),
('2025-10-03', 1, NULL, 3, NULL, 1, NULL, 1, 'Voluntary donation'),
('2025-10-05', 3, NULL, 4, 2, 1, NULL, 1, 'Emergency donation'),
('2025-10-08', 1, 'Kidney', 5, 3, NULL, 1, NULL, 'Organ donation'),
('2025-10-10', 2, NULL, 6, NULL, 1, NULL, 1, 'Regular checkup donation'),
('2025-10-12', 1, NULL, 7, 4, 1, NULL, 1, 'First time donor'),
('2025-10-15', 2, NULL, 8, NULL, 1, NULL, 1, 'Repeat donor'),
('2025-10-18', 1, 'Brain', 9, 5, NULL, 2, NULL, 'Critical organ donation'),
('2025-10-20', 3, NULL, 10, 6, 1, NULL, 1, 'Group donation drive'),
('2025-10-25', 1, NULL, 2, NULL, 1, NULL, 1, 'Walk-in donation');