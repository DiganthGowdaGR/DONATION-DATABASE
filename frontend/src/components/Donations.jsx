import React, { useState, useEffect } from 'react'
import { donationsAPI, donorsAPI, patientsAPI, bloodAPI, organsAPI } from '../api'

const Donations = () => {
  const [donations, setDonations] = useState([])
  const [donors, setDonors] = useState([])
  const [patients, setPatients] = useState([])
  const [bloodInventory, setBloodInventory] = useState([])
  const [organInventory, setOrganInventory] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showAudit, setShowAudit] = useState(false)
  const [formData, setFormData] = useState({
    donationDate: new Date().toISOString().split('T')[0],
    quantity: '',
    organType: '',
    donorID: '',
    patientID: '',
    bloodID: '',
    organID: '',
    bankID: '',
    notes: ''
  })

  useEffect(() => {
    fetchDonations()
    fetchDonors()
    fetchPatients()
    fetchBloodInventory()
    fetchOrganInventory()
  }, [])

  const fetchDonations = async () => {
    try {
      const response = await donationsAPI.getAll()
      setDonations(response.data)
    } catch (error) {
      console.error('Error fetching donations:', error)
    }
  }

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

  const fetchBloodInventory = async () => {
    try {
      const response = await bloodAPI.getInventory()
      setBloodInventory(response.data)
    } catch (error) {
      console.error('Error fetching blood inventory:', error)
    }
  }

  const fetchOrganInventory = async () => {
    try {
      const response = await organsAPI.getInventory()
      setOrganInventory(response.data)
    } catch (error) {
      console.error('Error fetching organ inventory:', error)
    }
  }

  const fetchAuditLogs = async () => {
    try {
      const response = await donationsAPI.getAuditLogs()
      setAuditLogs(response.data)
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      alert('Please enter a valid quantity greater than 0')
      return
    }

    if (!formData.bloodID && !formData.organID) {
      alert('Please select either a blood record or an organ record for the donation')
      return
    }

    try {
      // Prepare data with proper types
      const donationData = {
        donationDate: formData.donationDate,
        quantity: parseInt(formData.quantity),
        organType: formData.organType || null,
        donorID: formData.donorID ? parseInt(formData.donorID) : null,
        patientID: formData.patientID ? parseInt(formData.patientID) : null,
        bloodID: formData.bloodID ? parseInt(formData.bloodID) : null,
        organID: formData.organID ? parseInt(formData.organID) : null,
        bankID: formData.bankID ? parseInt(formData.bankID) : null,
        notes: formData.notes || null
      }

      await donationsAPI.create(donationData)
      setFormData({
        donationDate: new Date().toISOString().split('T')[0],
        quantity: '',
        organType: '',
        donorID: '',
        patientID: '',
        bloodID: '',
        organID: '',
        bankID: '',
        notes: ''
      })
      setShowForm(false)
      fetchDonations()
      fetchBloodInventory() // Refresh to see trigger effects
      fetchOrganInventory() // Refresh to see trigger effects
      alert('✅ Donation recorded successfully! Inventory updated automatically by triggers.')
    } catch (error) {
      console.error('Error creating donation:', error)
      const errorMessage = error.response?.data?.error || error.message
      alert('❌ Error: ' + errorMessage)
    }
  }

  const handleDelete = async (donationId, donorName, quantity, bloodGroup, organType) => {
    const itemType = bloodGroup ? `${quantity} units of ${bloodGroup} blood` : `${quantity} ${organType} organ(s)`
    const confirmMessage = `Are you sure you want to delete this donation?\n\nDonor: ${donorName || 'Anonymous'}\nItem: ${itemType}\n\n⚠️ This will restore the inventory automatically via database triggers.`
    
    if (window.confirm(confirmMessage)) {
      try {
        await donationsAPI.delete(donationId)
        fetchDonations()
        fetchBloodInventory() // Refresh to see trigger effects
        fetchOrganInventory() // Refresh to see trigger effects
        if (showAudit) fetchAuditLogs() // Refresh audit logs if visible
        alert('✅ Donation deleted successfully! Inventory restored automatically by triggers.')
      } catch (error) {
        console.error('Error deleting donation:', error)
        const errorMessage = error.response?.data?.error || error.message
        alert('❌ Error deleting donation: ' + errorMessage)
      }
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'text-green-600 font-semibold'
      case 'Pending': return 'text-yellow-600 font-semibold'
      case 'Cancelled': return 'text-red-600 font-semibold'
      default: return 'text-gray-600'
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Donations & Triggers</h2>
        <div className="space-x-2">
          <button
            onClick={() => {
              setShowAudit(!showAudit)
              if (!showAudit) fetchAuditLogs()
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {showAudit ? 'Hide Audit Logs' : 'Show Trigger Logs'}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            {showForm ? 'Cancel' : 'Record Donation'}
          </button>
        </div>
      </div>

      {showAudit && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">🔍 Database Trigger Audit Logs</h3>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">Table</th>
                  <th className="text-left p-2">Action</th>
                  <th className="text-left p-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.AuditID} className="border-b text-xs">
                    <td className="p-2">{new Date(log.EventTime).toLocaleString()}</td>
                    <td className="p-2 font-semibold">{log.TableName}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded ${
                        log.Action === 'INSERT' ? 'bg-green-100 text-green-800' :
                        log.Action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {log.Action}
                      </span>
                    </td>
                    <td className="p-2">{log.Details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">⚡ Record New Donation (Triggers Will Auto-Update Inventory)</h3>
          <div className="bg-blue-50 p-3 rounded mb-4 text-sm text-blue-700">
            <strong>Note:</strong> Select either a Blood Record OR an Organ Record (not both). The database triggers will automatically validate stock and update inventory.
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
            <input
              type="date"
              className="form-input"
              value={formData.donationDate}
              onChange={(e) => setFormData({...formData, donationDate: e.target.value})}
              required
            />
            <input
              type="number"
              placeholder="Quantity"
              className="form-input"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Organ Type (if organ donation)"
              className="form-input"
              value={formData.organType}
              onChange={(e) => setFormData({...formData, organType: e.target.value})}
            />

            <select
              className="form-input"
              value={formData.donorID}
              onChange={(e) => setFormData({...formData, donorID: e.target.value})}
            >
              <option value="">Select Donor (Optional)</option>
              {donors.map(donor => (
                <option key={donor.DonorID} value={donor.DonorID}>
                  {donor.Name} ({donor.BloodGroup})
                </option>
              ))}
            </select>

            <select
              className="form-input"
              value={formData.patientID}
              onChange={(e) => setFormData({...formData, patientID: e.target.value})}
            >
              <option value="">Select Patient (Optional)</option>
              {patients.map(patient => (
                <option key={patient.PatientID} value={patient.PatientID}>
                  {patient.Name} ({patient.BloodGroup})
                </option>
              ))}
            </select>

            <select
              className="form-input"
              value={formData.bloodID}
              onChange={(e) => setFormData({...formData, bloodID: e.target.value})}
            >
              <option value="">Select Blood Record (Optional)</option>
              {bloodInventory.map(blood => (
                <option key={blood.BloodID} value={blood.BloodID}>
                  {blood.BloodGroup} - {blood.Quantity} units ({blood.BankName})
                </option>
              ))}
            </select>

            <select
              className="form-input"
              value={formData.organID}
              onChange={(e) => setFormData({...formData, organID: e.target.value})}
            >
              <option value="">Select Organ Record (Optional)</option>
              {organInventory.map(organ => (
                <option key={organ.OrganID} value={organ.OrganID}>
                  {organ.OrganType} - {organ.Quantity} available ({organ.OrganCondition})
                </option>
              ))}
            </select>

            <textarea
              placeholder="Notes"
              className="form-input col-span-3"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows="2"
            />

            <button type="submit" className="btn-primary col-span-3">
              🚀 Record Donation (Triggers Will Update Inventory Automatically)
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="bg-yellow-50 p-3 rounded mb-4 text-sm text-yellow-700 border border-yellow-200">
          <strong>🔄 Delete Feature:</strong> When you delete a donation record, the database triggers will automatically restore the inventory quantities. This demonstrates the AFTER DELETE trigger functionality.
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Donor</th>
                <th className="text-left p-2">Patient</th>
                <th className="text-left p-2">Quantity</th>
                <th className="text-left p-2">Blood Group</th>
                <th className="text-left p-2">Organ Type</th>
                <th className="text-left p-2">Bank</th>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Notes</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {donations.map(donation => (
                <tr key={donation.DonationID} className="border-b hover:bg-gray-50">
                  <td className="p-2">{donation.DonorName || 'Anonymous'}</td>
                  <td className="p-2">{donation.PatientName || 'General Pool'}</td>
                  <td className="p-2 font-semibold text-blue-600">{donation.Quantity}</td>
                  <td className="p-2">{donation.BloodGroup || 'N/A'}</td>
                  <td className="p-2">{donation.OrganType || donation.OrganTypeName || 'N/A'}</td>
                  <td className="p-2">{donation.BankName || 'N/A'}</td>
                  <td className="p-2">{new Date(donation.DonationDate).toLocaleDateString()}</td>
                  <td className="p-2 text-sm">{donation.Notes || 'No notes'}</td>
                  <td className="p-2">
                    <button
                      onClick={() => handleDelete(
                        donation.DonationID,
                        donation.DonorName,
                        donation.Quantity,
                        donation.BloodGroup,
                        donation.OrganType || donation.OrganTypeName
                      )}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      title="Delete donation (will restore inventory via triggers)"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">🔧 How Database Triggers Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-yellow-50 p-4 rounded border-l-4 border-yellow-400">
            <h4 className="font-semibold text-yellow-800 mb-2">🔍 BEFORE INSERT Trigger</h4>
            <p className="text-sm text-yellow-700">
              Validates stock availability before allowing donation. 
              Prevents donations if insufficient inventory.
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded border-l-4 border-green-400">
            <h4 className="font-semibold text-green-800 mb-2">⚡ AFTER INSERT Trigger</h4>
            <p className="text-sm text-green-700">
              Automatically decrements blood/organ quantities and updates bank totals. 
              Creates audit log entries.
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
            <h4 className="font-semibold text-blue-800 mb-2">🔄 AFTER DELETE Trigger</h4>
            <p className="text-sm text-blue-700">
              Restores inventory when donations are cancelled. 
              Maintains data consistency automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Donations