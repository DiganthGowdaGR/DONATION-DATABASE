import React, { useState, useEffect } from 'react'
import { donationsAPI, donorsAPI, patientsAPI } from '../api'

const Procedures = () => {
  const [activeTab, setActiveTab] = useState('compatibility')
  const [compatibility, setCompatibility] = useState([])
  const [inventoryReport, setInventoryReport] = useState([])
  const [donorHistory, setDonorHistory] = useState({ donations: [], summary: {} })
  const [criticalPatients, setCriticalPatients] = useState([])
  const [donors, setDonors] = useState([])
  const [patients, setPatients] = useState([])
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('A+')
  const [selectedDonor, setSelectedDonor] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchDonors()
    fetchPatients()
  }, [])

  const fetchDonors = async () => {
    try {
      const response = await donorsAPI.getAll()
      setDonors(response.data)
    } catch (error) {
      console.error('Error fetching donors:', error)
    }
  }

  const fetchPatients = async () => {
    try {
      const response = await patientsAPI.getAll()
      setPatients(response.data)
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }

  const fetchCompatibility = async (bloodGroup) => {
    setLoading(true)
    try {
      const response = await donationsAPI.getCompatibility(bloodGroup)
      setCompatibility(response.data)
    } catch (error) {
      console.error('Error fetching compatibility:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInventoryReport = async () => {
    setLoading(true)
    try {
      const response = await donationsAPI.getInventoryReport()
      setInventoryReport(response.data)
    } catch (error) {
      console.error('Error fetching inventory report:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDonorHistory = async (donorId) => {
    setLoading(true)
    try {
      const response = await donationsAPI.getDonorHistory(donorId)
      setDonorHistory(response.data)
    } catch (error) {
      console.error('Error fetching donor history:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCriticalPatients = async () => {
    setLoading(true)
    try {
      const response = await donationsAPI.getCriticalPatients()
      setCriticalPatients(response.data)
    } catch (error) {
      console.error('Error fetching critical patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    if (status.includes('CRITICAL')) return 'text-red-600 font-bold'
    if (status.includes('WARNING')) return 'text-orange-600 font-semibold'
    if (status.includes('CAUTION')) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getPriorityColor = (priority) => {
    if (priority.includes('CRITICAL')) return 'bg-red-100 text-red-800'
    if (priority.includes('HIGH')) return 'bg-orange-100 text-orange-800'
    if (priority.includes('MODERATE')) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const tabs = [
    { id: 'compatibility', label: '🩸 Blood Compatibility', action: () => fetchCompatibility(selectedBloodGroup) },
    { id: 'inventory', label: '📊 Inventory Report', action: fetchInventoryReport },
    { id: 'history', label: '📋 Donor History', action: () => selectedDonor && fetchDonorHistory(selectedDonor) },
    { id: 'critical', label: '🚨 Critical Patients', action: fetchCriticalPatients }
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">🔧 Stored Procedures Dashboard</h2>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">What are Stored Procedures?</h3>
        <p className="text-blue-700 text-sm">
          Stored procedures are pre-compiled SQL code blocks stored in the database. They provide better performance, 
          security, and reusability compared to regular SQL queries. Click the tabs below to see different procedures in action.
        </p>
      </div>

      <div className="flex space-x-1 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              tab.action()
            }}
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}

      {/* Blood Compatibility Tab */}
      {activeTab === 'compatibility' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">🩸 Blood Compatibility Checker</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Patient Blood Group:</label>
            <select
              className="form-input w-48"
              value={selectedBloodGroup}
              onChange={(e) => {
                setSelectedBloodGroup(e.target.value)
                fetchCompatibility(e.target.value)
              }}
            >
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
            <strong>Procedure:</strong> <code>GetBloodCompatibility('{selectedBloodGroup}')</code><br/>
            <strong>Purpose:</strong> Finds all compatible blood donors and available blood units for a patient with {selectedBloodGroup} blood type.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Donor</th>
                  <th className="text-left p-2">Blood Group</th>
                  <th className="text-left p-2">Contact</th>
                  <th className="text-left p-2">Available Units</th>
                  <th className="text-left p-2">Bank</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {compatibility.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{item.DonorName}</td>
                    <td className="p-2 font-semibold text-red-600">{item.BloodGroup}</td>
                    <td className="p-2">{item.Contact}</td>
                    <td className="p-2 font-semibold text-blue-600">{item.AvailableUnits} units</td>
                    <td className="p-2">{item.BankName}</td>
                    <td className="p-2 text-green-600 font-semibold">{item.CompatibilityStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inventory Report Tab */}
      {activeTab === 'inventory' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">📊 Comprehensive Inventory Report</h3>
          
          <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
            <strong>Procedure:</strong> <code>GetInventoryReport()</code><br/>
            <strong>Purpose:</strong> Generates a complete inventory analysis with stock levels, alerts, and recommended actions.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Item</th>
                  <th className="text-left p-2">Quantity</th>
                  <th className="text-left p-2">Bank/Location</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Recommended Action</th>
                </tr>
              </thead>
              <tbody>
                {inventoryReport.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 font-semibold">{item.ItemType}</td>
                    <td className="p-2">{item.ItemName}</td>
                    <td className="p-2 font-semibold text-blue-600">{item.Quantity}</td>
                    <td className="p-2">{item.BankName} - {item.Location}</td>
                    <td className={`p-2 ${getStatusColor(item.StockStatus)}`}>{item.StockStatus}</td>
                    <td className="p-2 text-sm">{item.RecommendedAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Donor History Tab */}
      {activeTab === 'history' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">📋 Donor History Analysis</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Donor:</label>
            <select
              className="form-input w-64"
              value={selectedDonor}
              onChange={(e) => {
                setSelectedDonor(e.target.value)
                if (e.target.value) fetchDonorHistory(e.target.value)
              }}
            >
              <option value="">Choose a donor...</option>
              {donors.map(donor => (
                <option key={donor.DonorID} value={donor.DonorID}>
                  {donor.Name} ({donor.BloodGroup})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
            <strong>Procedure:</strong> <code>GetDonorHistory({selectedDonor || 'donor_id'})</code><br/>
            <strong>Purpose:</strong> Retrieves complete donation history and statistics for a specific donor.
          </div>

          {donorHistory.summary.TotalDonations && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-2xl font-bold text-blue-600">{donorHistory.summary.TotalDonations}</div>
                <div className="text-sm text-blue-700">Total Donations</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-2xl font-bold text-green-600">{donorHistory.summary.TotalQuantityDonated}</div>
                <div className="text-sm text-green-700">Total Units</div>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <div className="text-2xl font-bold text-purple-600">{donorHistory.summary.DaysSinceLastDonation}</div>
                <div className="text-sm text-purple-700">Days Since Last</div>
              </div>
              <div className="bg-orange-50 p-3 rounded">
                <div className="text-lg font-bold text-orange-600">
                  {donorHistory.summary.FirstDonation ? new Date(donorHistory.summary.FirstDonation).toLocaleDateString() : 'N/A'}
                </div>
                <div className="text-sm text-orange-700">First Donation</div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Quantity</th>
                  <th className="text-left p-2">Recipient</th>
                  <th className="text-left p-2">Bank</th>
                  <th className="text-left p-2">Days Ago</th>
                  <th className="text-left p-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {donorHistory.donations.map((donation, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{new Date(donation.DonationDate).toLocaleDateString()}</td>
                    <td className="p-2">{donation.DonationType}</td>
                    <td className="p-2 font-semibold text-blue-600">{donation.Quantity}</td>
                    <td className="p-2">{donation.RecipientPatient}</td>
                    <td className="p-2">{donation.BankName}</td>
                    <td className="p-2 text-gray-600">{donation.DaysAgo} days</td>
                    <td className="p-2 text-sm">{donation.Notes || 'No notes'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Critical Patients Tab */}
      {activeTab === 'critical' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">🚨 Critical Patients Priority List</h3>
          
          <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
            <strong>Procedure:</strong> <code>GetCriticalPatients()</code><br/>
            <strong>Purpose:</strong> Identifies patients who need urgent attention based on waiting time and blood availability.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Patient</th>
                  <th className="text-left p-2">Blood Group</th>
                  <th className="text-left p-2">Contact</th>
                  <th className="text-left p-2">Days Waiting</th>
                  <th className="text-left p-2">Priority Level</th>
                  <th className="text-left p-2">Compatible Blood Available</th>
                </tr>
              </thead>
              <tbody>
                {criticalPatients.map((patient, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 font-semibold">{patient.Name}</td>
                    <td className="p-2 font-semibold text-red-600">{patient.BloodGroup}</td>
                    <td className="p-2">{patient.Contact}</td>
                    <td className="p-2 font-semibold text-blue-600">{patient.DaysWaiting} days</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(patient.PriorityLevel)}`}>
                        {patient.PriorityLevel}
                      </span>
                    </td>
                    <td className="p-2 font-semibold text-green-600">{patient.CompatibleBloodUnits || 0} units</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Procedures