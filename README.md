# 🩸 Blood & Organ Donation Management System

A comprehensive web-based system for managing blood and organ donations with real-time inventory tracking, automated triggers, and advanced database functions.

## 🎯 Features

### ✅ Core Functionality
- **Real-time Donation Management** - Donors can give blood/organs, patients can receive
- **Inventory Tracking** - Automatic blood and organ inventory updates
- **Multi-Bank Support** - Multiple blood banks and organ banks
- **Complete Audit Trail** - Every transaction automatically logged

### ✅ Advanced Database Features
- **Database Triggers** - Automatic inventory management and validation
- **Stored Procedures** - Complex analysis and reporting
- **MySQL Functions** - Real-time calculations and compatibility scoring
- **Foreign Key Relationships** - Complete data integrity

### ✅ User Interface
- **Responsive Design** - Works on desktop and mobile
- **Real-time Updates** - Inventory refreshes automatically
- **Intuitive Navigation** - Easy-to-use tabs and forms
- **Visual Indicators** - Color-coded status and priority levels

## 🏗️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MySQL** database with advanced features
- **RESTful API** architecture
- **Real-time triggers** and stored procedures

### Frontend
- **React** with modern hooks
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Axios** for API communication

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blood-organ-donation-system
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Copy environment template
   cp .env.example .env
   # Edit .env with your MySQL credentials
   ```

3. **Database Setup**
   ```bash
   # Create database and tables
   mysql -u root -p < init_db.sql
   
   # Add sample data (optional)
   mysql -u root -p donation_db < comprehensive_sample_data.sql
   ```

4. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Start the Application**
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm run dev
   
   # Terminal 2: Start frontend
   cd frontend
   npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/api/health

## 📊 Database Schema

### Core Tables
- **Donor** - Donor information and blood types
- **Patient** - Patient information and needs
- **BloodBank** - Blood bank locations and capacity
- **OrganBank** - Organ bank locations
- **Blood** - Blood inventory by type and bank
- **Organ** - Organ inventory by type and condition
- **DonationRecord** - All donation transactions
- **AuditLog** - Automatic audit trail

### Advanced Features
- **3 Database Triggers** - Automatic inventory management
- **4 Stored Procedures** - Complex analysis and reporting
- **9 MySQL Functions** - Real-time calculations

## 🎮 Usage Guide

### For Donors
1. Go to **Donors** tab
2. Click **"🩸 Make Donation"**
3. Select donor and donation type (Blood/Organ)
4. Enter quantity and notes
5. Submit - inventory updates automatically!

### For Medical Staff
1. **Blood Inventory** - View real-time blood availability
2. **Organ Inventory** - Check organ availability and conditions
3. **Patients** - Manage patient information and needs
4. **Donations** - Track all donation history

### For Administrators
1. **Stored Procedures** - Run complex analysis reports
2. **MySQL Functions** - Get compatibility scores and summaries
3. **Audit Logs** - Review complete transaction history

## 🔧 API Endpoints

### Core Endpoints
```
GET    /api/donors          - Get all donors
POST   /api/donors          - Add new donor
GET    /api/patients        - Get all patients
POST   /api/patients        - Add new patient
GET    /api/blood           - Get blood inventory
GET    /api/organs          - Get organ inventory
GET    /api/donations       - Get donation history
POST   /api/donations       - Record new donation
DELETE /api/donations/:id   - Delete donation (restores inventory)
```

### Advanced Endpoints
```
GET    /api/donations/compatibility/:bloodGroup    - Blood compatibility
GET    /api/donations/inventory-report             - Comprehensive report
GET    /api/donations/donor-history/:donorId      - Donor history
GET    /api/donations/critical-patients           - Priority patients
```

## 🧪 Testing Database Features

### Test Triggers
```sql
-- Check current inventory
SELECT * FROM Blood WHERE BloodGroup = 'O+';

-- Record donation (triggers will update inventory)
INSERT INTO DonationRecord (DonationDate, Quantity, DonorID, BloodID, BankID) 
VALUES (CURDATE(), 2, 1, 1, 1);

-- Verify inventory updated
SELECT * FROM Blood WHERE BloodGroup = 'O+';
```

### Test Functions
```sql
-- Blood compatibility scoring
SELECT CalculateBloodCompatibilityScore('O-', 'A+');

-- Donor summary from database
SELECT GetDonorSummaryByName('Rajesh Kumar');

-- Real-time availability
SELECT GetRealTimeBloodAvailability('O+');
```

### Test Procedures
```sql
-- Blood compatibility analysis
CALL GetBloodCompatibility('A+');

-- Comprehensive inventory report
CALL GetInventoryReport();

-- Critical patients list
CALL GetCriticalPatients();
```

## 📁 Project Structure

```
project-root/
├── backend/
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── server.js        # Express server setup
│   │   └── db.js           # Database connection
│   ├── init_db.sql         # Database schema + triggers + procedures + functions
│   ├── .env.example        # Environment template
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/      # React components
    │   ├── App.jsx         # Main application
    │   └── api.js          # API client
    ├── index.html
    └── package.json
```

## 🛡️ Security Features

- **Environment Variables** - Sensitive data in .env files
- **SQL Injection Prevention** - Parameterized queries
- **Input Validation** - Frontend and backend validation
- **Audit Logging** - Complete transaction history
- **Database Triggers** - Automatic data validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](../../issues) page
2. Verify your MySQL connection in `.env`
3. Ensure all dependencies are installed
4. Check the console for error messages

## 🎯 System Highlights

- **Real-time Inventory Management** with database triggers
- **Advanced MySQL Features** (functions, procedures, triggers)
- **Complete Audit Trail** for all transactions
- **Multi-bank Operations** with distributed inventory
- **Responsive Web Interface** with modern React
- **RESTful API** with comprehensive endpoints
- **Production-ready** with proper error handling

---

**Built with ❤️ for saving lives through efficient donation management**
** SHARATH GR **
