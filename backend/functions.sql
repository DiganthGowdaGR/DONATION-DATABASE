-- ================================
-- REAL MYSQL FUNCTIONS FOR DONATION SYSTEM
-- These functions derive data directly from the database
-- ================================
USE donation_db;

DELIMITER $

/*
  FUNCTION: CalculateBloodCompatibilityScore
  PURPOSE: Calculate compatibility score between donor and patient blood types
  PARAMETERS: 
    - donor_blood: Donor's blood group
    - patient_blood: Patient's blood group
  RETURNS: INT (0-100 compatibility score)
  
  WHY USED: Provides numerical compatibility rating for matching algorithms
  Higher score = better compatibility match
*/
DROP FUNCTION IF EXISTS CalculateBloodCompatibilityScore$
CREATE FUNCTION CalculateBloodCompatibilityScore(
  donor_blood VARCHAR(5), 
  patient_blood VARCHAR(5)
) 
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE compatibility_score INT DEFAULT 0;
  
  -- Perfect match gets highest score
  IF donor_blood = patient_blood THEN
    SET compatibility_score = 100;
  
  -- Universal donor O- can give to anyone
  ELSEIF donor_blood = 'O-' THEN
    SET compatibility_score = 95;
  
  -- Universal recipient AB+ can receive from anyone
  ELSEIF patient_blood = 'AB+' THEN
    SET compatibility_score = 90;
  
  -- Specific compatibility rules
  ELSEIF (patient_blood = 'A+' AND donor_blood IN ('A-', 'O+', 'O-')) THEN
    SET compatibility_score = 85;
  ELSEIF (patient_blood = 'A-' AND donor_blood = 'O-') THEN
    SET compatibility_score = 85;
  ELSEIF (patient_blood = 'B+' AND donor_blood IN ('B-', 'O+', 'O-')) THEN
    SET compatibility_score = 85;
  ELSEIF (patient_blood = 'B-' AND donor_blood = 'O-') THEN
    SET compatibility_score = 85;
  ELSEIF (patient_blood = 'AB-' AND donor_blood IN ('A-', 'B-', 'O-')) THEN
    SET compatibility_score = 85;
  ELSEIF (patient_blood = 'O+' AND donor_blood = 'O-') THEN
    SET compatibility_score = 85;
  
  -- No compatibility
  ELSE
    SET compatibility_score = 0;
  END IF;
  
  RETURN compatibility_score;
END$

/*
  FUNCTION: GetDonorRiskLevel
  PURPOSE: Assess donor health risk based on age and disease history
  PARAMETERS:
    - donor_age: Donor's age
    - disease_history: Disease information
  RETURNS: VARCHAR(20) - Risk level classification
  
  WHY USED: Medical screening for donor eligibility
  Helps medical staff prioritize donor health assessments
*/
DROP FUNCTION IF EXISTS GetDonorRiskLevel$
CREATE FUNCTION GetDonorRiskLevel(
  donor_age INT, 
  disease_history VARCHAR(255)
) 
RETURNS VARCHAR(20)
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE risk_level VARCHAR(20) DEFAULT 'UNKNOWN';
  
  -- High risk conditions
  IF disease_history IS NOT NULL AND 
     (UPPER(disease_history) LIKE '%DIABETES%' OR
      UPPER(disease_history) LIKE '%HEART%' OR
      UPPER(disease_history) LIKE '%CANCER%' OR
      UPPER(disease_history) LIKE '%HIV%' OR
      UPPER(disease_history) LIKE '%HEPATITIS%') THEN
    SET risk_level = 'HIGH_RISK';
  
  -- Age-based risk assessment
  ELSEIF donor_age < 18 OR donor_age > 65 THEN
    SET risk_level = 'MODERATE_RISK';
  
  -- Medium risk for certain conditions
  ELSEIF disease_history IS NOT NULL AND 
         (UPPER(disease_history) LIKE '%HYPERTENSION%' OR
          UPPER(disease_history) LIKE '%ASTHMA%' OR
          UPPER(disease_history) LIKE '%ALLERGY%') THEN
    SET risk_level = 'MODERATE_RISK';
  
  -- Low risk for healthy donors
  ELSEIF (disease_history IS NULL OR UPPER(disease_history) = 'NONE') AND
         donor_age BETWEEN 18 AND 65 THEN
    SET risk_level = 'LOW_RISK';
  
  -- Default moderate risk
  ELSE
    SET risk_level = 'MODERATE_RISK';
  END IF;
  
  RETURN risk_level;
END$

/*
  FUNCTION: GetRealTimeBloodAvailability
  PURPOSE: Get real-time blood availability for a specific blood group
  PARAMETERS:
    - blood_group: Blood group to check
  RETURNS: INT - Available units in real-time
  
  WHY USED: Real-time inventory checking for donations and requests
*/
DROP FUNCTION IF EXISTS GetRealTimeBloodAvailability$
CREATE FUNCTION GetRealTimeBloodAvailability(blood_group VARCHAR(5)) 
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE available_units INT DEFAULT 0;
  
  SELECT COALESCE(SUM(Quantity), 0) INTO available_units
  FROM Blood 
  WHERE BloodGroup = blood_group;
  
  RETURN available_units;
END$

/*
  FUNCTION: GetPatientWaitingPriority
  PURPOSE: Calculate patient priority score based on multiple factors
  PARAMETERS:
    - days_waiting: Number of days patient has been waiting
    - blood_group: Patient's blood group (rarity factor)
    - compatible_units: Available compatible blood units
  RETURNS: INT (1-100 priority score, higher = more urgent)
  
  WHY USED: Automated patient prioritization for medical staff
  Combines multiple factors for fair resource allocation
*/
DROP FUNCTION IF EXISTS GetPatientWaitingPriority$
CREATE FUNCTION GetPatientWaitingPriority(
  days_waiting INT,
  blood_group VARCHAR(5),
  compatible_units INT
) 
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE priority_score INT DEFAULT 0;
  DECLARE time_score INT DEFAULT 0;
  DECLARE rarity_score INT DEFAULT 0;
  DECLARE availability_score INT DEFAULT 0;
  
  -- Time-based scoring (0-40 points)
  IF days_waiting >= 60 THEN SET time_score = 40;
  ELSEIF days_waiting >= 30 THEN SET time_score = 30;
  ELSEIF days_waiting >= 14 THEN SET time_score = 20;
  ELSEIF days_waiting >= 7 THEN SET time_score = 10;
  ELSE SET time_score = 0;
  END IF;
  
  -- Blood group rarity scoring (0-30 points)
  CASE blood_group
    WHEN 'AB-' THEN SET rarity_score = 30; -- Rarest
    WHEN 'B-' THEN SET rarity_score = 25;
    WHEN 'A-' THEN SET rarity_score = 25;
    WHEN 'O-' THEN SET rarity_score = 20; -- Rare but universal donor available
    WHEN 'AB+' THEN SET rarity_score = 15; -- Universal recipient
    WHEN 'B+' THEN SET rarity_score = 10;
    WHEN 'A+' THEN SET rarity_score = 10;
    WHEN 'O+' THEN SET rarity_score = 5; -- Most common
    ELSE SET rarity_score = 0;
  END CASE;
  
  -- Availability scoring (0-30 points, inverse relationship)
  IF compatible_units = 0 THEN SET availability_score = 30;
  ELSEIF compatible_units <= 2 THEN SET availability_score = 25;
  ELSEIF compatible_units <= 5 THEN SET availability_score = 20;
  ELSEIF compatible_units <= 10 THEN SET availability_score = 15;
  ELSEIF compatible_units <= 20 THEN SET availability_score = 10;
  ELSE SET availability_score = 5;
  END IF;
  
  SET priority_score = time_score + rarity_score + availability_score;
  
  -- Ensure score is within bounds
  IF priority_score > 100 THEN SET priority_score = 100; END IF;
  IF priority_score < 1 THEN SET priority_score = 1; END IF;
  
  RETURN priority_score;
END$

/*
  FUNCTION: GetDonorSummaryByName
  PURPOSE: Generate complete donor summary by looking up donor in database
  PARAMETERS:
    - donor_name: Name of the donor to look up
  RETURNS: TEXT - Complete formatted summary from database data
  
  WHY USED: Real function that queries database to generate donor reports
  Just provide donor name, function does all the database lookups
*/
DROP FUNCTION IF EXISTS GetDonorSummaryByName$
CREATE FUNCTION GetDonorSummaryByName(donor_name VARCHAR(120)) 
RETURNS TEXT
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE donor_id INT DEFAULT NULL;
  DECLARE donor_blood VARCHAR(5) DEFAULT '';
  DECLARE donor_age INT DEFAULT 0;
  DECLARE total_donations INT DEFAULT 0;
  DECLARE total_quantity INT DEFAULT 0;
  DECLARE last_donation_days INT DEFAULT 999;
  DECLARE recognition_level VARCHAR(50) DEFAULT '';
  DECLARE summary_text TEXT DEFAULT '';
  
  -- Find donor in database
  SELECT DonorID, BloodGroup, Age INTO donor_id, donor_blood, donor_age
  FROM Donor WHERE Name = donor_name LIMIT 1;
  
  -- If donor not found, return error message
  IF donor_id IS NULL THEN
    RETURN CONCAT('❌ ERROR: Donor "', donor_name, '" not found in database');
  END IF;
  
  -- Get donation statistics from database
  SELECT 
    COUNT(*),
    COALESCE(SUM(Quantity), 0),
    COALESCE(DATEDIFF(CURDATE(), MAX(DonationDate)), 999)
  INTO total_donations, total_quantity, last_donation_days
  FROM DonationRecord 
  WHERE DonorID = donor_id;
  
  -- Determine recognition level based on actual data
  IF total_donations >= 50 THEN SET recognition_level = 'PLATINUM HERO';
  ELSEIF total_donations >= 25 THEN SET recognition_level = 'GOLD CHAMPION';
  ELSEIF total_donations >= 10 THEN SET recognition_level = 'SILVER SUPPORTER';
  ELSEIF total_donations >= 5 THEN SET recognition_level = 'BRONZE CONTRIBUTOR';
  ELSEIF total_donations > 0 THEN SET recognition_level = 'VALUED DONOR';
  ELSE SET recognition_level = 'NEW DONOR';
  END IF;
  
  -- Build summary from real database data
  SET summary_text = CONCAT(
    '🏆 DONOR PROFILE: ', donor_name, '\n',
    '🆔 Donor ID: ', donor_id, '\n',
    '🩸 Blood Group: ', donor_blood, '\n',
    '👤 Age: ', donor_age, ' years\n',
    '📊 Recognition Level: ', recognition_level, '\n',
    '💝 Total Donations: ', total_donations, ' times\n',
    '🩸 Total Units Donated: ', total_quantity, ' units\n',
    '📅 Last Donation: ', 
    CASE 
      WHEN total_donations = 0 THEN 'No donations yet'
      WHEN last_donation_days = 0 THEN 'Today'
      WHEN last_donation_days = 1 THEN '1 day ago'
      WHEN last_donation_days <= 7 THEN CONCAT(last_donation_days, ' days ago')
      WHEN last_donation_days <= 30 THEN CONCAT(ROUND(last_donation_days/7), ' weeks ago')
      WHEN last_donation_days <= 365 THEN CONCAT(ROUND(last_donation_days/30), ' months ago')
      ELSE 'Over a year ago'
    END, '\n',
    '⭐ Status: ',
    CASE 
      WHEN total_donations = 0 THEN 'NEW DONOR - WELCOME!'
      WHEN last_donation_days <= 90 THEN 'ACTIVE DONOR'
      WHEN last_donation_days <= 365 THEN 'RECENT DONOR'
      ELSE 'INACTIVE - FOLLOW UP NEEDED'
    END
  );
  
  RETURN summary_text;
END$

/*
  FUNCTION: GetRealTimeOrganAvailability
  PURPOSE: Get real-time organ availability for a specific organ type
  PARAMETERS:
    - organ_type: Organ type to check
  RETURNS: INT - Available organs in real-time
  
  WHY USED: Real-time organ inventory checking
*/
DROP FUNCTION IF EXISTS GetRealTimeOrganAvailability$
CREATE FUNCTION GetRealTimeOrganAvailability(organ_type VARCHAR(100)) 
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE available_organs INT DEFAULT 0;
  
  SELECT COALESCE(SUM(Quantity), 0) INTO available_organs
  FROM Organ 
  WHERE OrganType = organ_type;
  
  RETURN available_organs;
END$

/*
  FUNCTION: GetPatientUrgencyByName
  PURPOSE: Get patient urgency score by looking up patient in database
  PARAMETERS:
    - patient_name: Name of patient to analyze
  RETURNS: INT - Urgency score based on real database data
  
  WHY USED: Real function that calculates patient priority from database
  Just provide patient name, function does all lookups
*/
DROP FUNCTION IF EXISTS GetPatientUrgencyByName$
CREATE FUNCTION GetPatientUrgencyByName(patient_name VARCHAR(120)) 
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE patient_id INT DEFAULT NULL;
  DECLARE patient_blood VARCHAR(5) DEFAULT '';
  DECLARE intake_date DATE DEFAULT NULL;
  DECLARE days_waiting INT DEFAULT 0;
  DECLARE compatible_units INT DEFAULT 0;
  DECLARE urgency_score INT DEFAULT 0;
  
  -- Find patient in database
  SELECT PatientID, BloodGroup, DateOfIntake 
  INTO patient_id, patient_blood, intake_date
  FROM Patient WHERE Name = patient_name LIMIT 1;
  
  -- If patient not found, return 0
  IF patient_id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate days waiting from actual database
  SET days_waiting = DATEDIFF(CURDATE(), intake_date);
  
  -- Get compatible blood units from actual inventory
  SELECT COALESCE(SUM(Quantity), 0) INTO compatible_units
  FROM Blood 
  WHERE CalculateBloodCompatibilityScore(BloodGroup, patient_blood) > 0;
  
  -- Calculate urgency using real database data
  SET urgency_score = GetPatientWaitingPriority(days_waiting, patient_blood, compatible_units);
  
  RETURN urgency_score;
END$

/*
  FUNCTION: GetBloodBankStatus
  PURPOSE: Get status summary of a specific blood bank from database
  PARAMETERS:
    - bank_name: Name of blood bank to analyze
  RETURNS: TEXT - Status report of the blood bank
  
  WHY USED: Real function that analyzes blood bank performance from database
  Provides operational insights based on actual data
*/
DROP FUNCTION IF EXISTS GetBloodBankStatus$
CREATE FUNCTION GetBloodBankStatus(bank_name VARCHAR(150)) 
RETURNS TEXT
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE bank_id INT DEFAULT NULL;
  DECLARE bank_location VARCHAR(255) DEFAULT '';
  DECLARE total_units INT DEFAULT 0;
  DECLARE total_value DECIMAL(15,2) DEFAULT 0.00;
  DECLARE blood_types_count INT DEFAULT 0;
  DECLARE critical_types INT DEFAULT 0;
  DECLARE status_text TEXT DEFAULT '';
  
  -- Find bank in database
  SELECT BankID, Location INTO bank_id, bank_location
  FROM BloodBank WHERE Name = bank_name LIMIT 1;
  
  -- If bank not found
  IF bank_id IS NULL THEN
    RETURN CONCAT('❌ ERROR: Blood Bank "', bank_name, '" not found in database');
  END IF;
  
  -- Get statistics from actual database
  SELECT 
    COUNT(*),
    SUM(Quantity),
    SUM(CalculateInventoryValue('BLOOD', Quantity, BloodGroup)),
    SUM(CASE WHEN Quantity < 10 THEN 1 ELSE 0 END)
  INTO blood_types_count, total_units, total_value, critical_types
  FROM Blood 
  WHERE BankID = bank_id;
  
  -- Build status report from real data
  SET status_text = CONCAT(
    '🏥 BLOOD BANK STATUS: ', bank_name, '\n',
    '📍 Location: ', bank_location, '\n',
    '🆔 Bank ID: ', bank_id, '\n',
    '🩸 Blood Types Available: ', blood_types_count, '\n',
    '📦 Total Units in Stock: ', COALESCE(total_units, 0), '\n',
    '💰 Total Inventory Value: ₹', FORMAT(COALESCE(total_value, 0), 2), '\n',
    '⚠️ Critical Stock Types: ', COALESCE(critical_types, 0), ' (< 10 units)\n',
    '📊 Status: ',
    CASE 
      WHEN total_units = 0 THEN 'EMPTY - URGENT RESTOCKING NEEDED'
      WHEN critical_types > 3 THEN 'CRITICAL - MULTIPLE LOW STOCKS'
      WHEN critical_types > 0 THEN 'WARNING - SOME LOW STOCKS'
      WHEN total_units < 50 THEN 'MODERATE - MONITOR CLOSELY'
      ELSE 'GOOD - ADEQUATE SUPPLIES'
    END
  );
  
  RETURN status_text;
END$

/*
  FUNCTION: GetDonationTrendAnalysis
  PURPOSE: Analyze donation trends from the last 30 days
  PARAMETERS: None
  RETURNS: TEXT - Trend analysis report from actual database
  
  WHY USED: Real function that analyzes donation patterns from database
  Provides insights for operational planning
*/
DROP FUNCTION IF EXISTS GetDonationTrendAnalysis$
CREATE FUNCTION GetDonationTrendAnalysis() 
RETURNS TEXT
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE total_donations INT DEFAULT 0;
  DECLARE total_units INT DEFAULT 0;
  DECLARE blood_donations INT DEFAULT 0;
  DECLARE organ_donations INT DEFAULT 0;
  DECLARE avg_daily DECIMAL(5,2) DEFAULT 0.00;
  DECLARE trend_text TEXT DEFAULT '';
  
  -- Get actual donation data from last 30 days
  SELECT 
    COUNT(*),
    SUM(Quantity),
    SUM(CASE WHEN BloodID IS NOT NULL THEN 1 ELSE 0 END),
    SUM(CASE WHEN OrganID IS NOT NULL THEN 1 ELSE 0 END)
  INTO total_donations, total_units, blood_donations, organ_donations
  FROM DonationRecord 
  WHERE DonationDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);
  
  SET avg_daily = total_donations / 30.0;
  
  -- Build trend analysis from real data
  SET trend_text = CONCAT(
    '📈 DONATION TREND ANALYSIS (Last 30 Days)\n',
    '📅 Period: ', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 30 DAY), '%Y-%m-%d'), 
    ' to ', DATE_FORMAT(CURDATE(), '%Y-%m-%d'), '\n',
    '💝 Total Donations: ', total_donations, '\n',
    '📦 Total Units Collected: ', COALESCE(total_units, 0), '\n',
    '🩸 Blood Donations: ', blood_donations, ' (', 
    ROUND((blood_donations * 100.0) / GREATEST(total_donations, 1), 1), '%)\n',
    '🫀 Organ Donations: ', organ_donations, ' (',
    ROUND((organ_donations * 100.0) / GREATEST(total_donations, 1), 1), '%)\n',
    '📊 Daily Average: ', ROUND(avg_daily, 2), ' donations/day\n',
    '📈 Trend Status: ',
    CASE 
      WHEN total_donations = 0 THEN 'NO ACTIVITY - URGENT ACTION NEEDED'
      WHEN avg_daily < 1 THEN 'LOW ACTIVITY - INCREASE CAMPAIGNS'
      WHEN avg_daily < 3 THEN 'MODERATE ACTIVITY - MAINTAIN EFFORTS'
      ELSE 'HIGH ACTIVITY - EXCELLENT PERFORMANCE'
    END
  );
  
  RETURN trend_text;
END$

DELIMITER ;