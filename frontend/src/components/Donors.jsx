import React, { useState, useEffect } from 'react'
import { donorsAPI, bloodAPI, organsAPI, donationsAPI } from '../api'

const Donors = () => {
  const [donors, setDonors] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'M',
    bloodGroup: 'A+',
    address: '',
    contact: '',
    disease: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [showDonationForm, setShowDonationForm] = useState(false)
  const [donationForm, setDonationForm] = useState({
    donorId: '',
    donationType: 'Blood',
    quantity: 1,
    organType: '',
    notes: ''
  })
  const [bloodInventory, setBloodInventory] = useState([])
  const [organInventory, setOrganInventory] = useState([])

  useEffect(() => {
    fetchDonors()
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const [bloodRes, organRes] = await Promise.all([
        bloodAPI.getInventory(),
        organsAPI.getInventory()
      ])
      setBloodInventory(bloodRes.data)
      setOrganInventory(organRes.data)
    } catch (error) {
      console.error('Error fetching inventory:', error)
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await donorsAPI.update(editingId, formData)
        setEditingId(null)
      } else {
        await donorsAPI.create(formData)
      }
      setFormData({ name: '', age: '', gender: 'M', bloodGroup: 'A+', address: '', contact: '', disease: '' })
      setShowForm(false)
      fetchDonors()
    } catch (error) {
      console.error('Error saving donor:', error)
    }
  }

  const handleEdit = (donor) => {
    setFormData({
      name: donor.Name,
      age: donor.Age,
      gender: donor.Gender,
      bloodGroup: donor.BloodGroup,
      address: donor.Address,
      contact: donor.Contact,
      disease: donor.Disease
    })
    setEditingId(donor.DonorID)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this donor?')) {
      try {
        await donorsAPI.delete(id)
        fetchDonors()
      } catch (error) {
        console.error('Error deleting donor:', error)
      }
    }
  }

  const handleDonate = (donor) => {
    setDonationForm({
      donorId: donor.DonorID,
      donationType: 'Blood',
      quantity: 1,
      organType: '',
      notes: ''
    })
    setShowDonationForm(true)
  }

  const handleDonationSubmit = async (e) => {
    e.preventDefault()
    try {
      const donor = donors.find(d => d.DonorID === donationForm.donorId)
      let bloodID = null
      let organID = null
      let bankID = 1 // Default bank

      if (donationForm.donationType === 'Blood') {
        // Find or create blood record for donor's blood group
        const findOrCreateResponse = await bloodAPI.findOrCreate({
          bloodGroup: donor.BloodGroup,
          bankID: 1
        })
        bloodID = findOrCreateResponse.data.BloodID
      } else {
        // For organs, find existing or create new organ record
        const organRecord = organInventory.find(o => o.OrganType === donationForm.organType)
        if (organRecord) {
          organID = organRecord.OrganID
        } else {
          // Create new organ record if doesn't exist
          const newOrganResponse = await organsAPI.create({
            organType: donationForm.organType,
            organCondition: 'Good',
            organBankID: 1,
            quantity: 0
          })
          organID = newOrganResponse.data.id
        }
      }

      const donationData = {
        donationDate: new Date().toISOString().split('T')[0],
        quantity: parseInt(donationForm.quantity),
        organType: donationForm.donationType === 'Organ' ? donationForm.organType : null,
        donorID: donationForm.donorId,
        patientID: null,
        bloodID,
        organID,
        bankID: donationForm.donationType === 'Blood' ? bankID : null,
        notes: donationForm.notes
      }

      const response = await donationsAPI.create(donationData)
      
      alert(`✅ Donation successful! ${donationForm.quantity} units of ${donationForm.donationType === 'Blood' ? donor.BloodGroup + ' blood' : donationForm.organType} donated.`)
      setShowDonationForm(false)
      setDonationForm({
        donorId: '',
        donationType: 'Blood',
        quantity: 1,
        organType: '',
        notes: ''
      })
      
      // Refresh all data to show real-time updates
      fetchInventory()
      
      // Trigger a refresh of the parent components if needed
      window.dispatchEvent(new CustomEvent('inventoryUpdated'))
      
    } catch (error) {
      console.error('Error processing donation:', error)
      alert(`❌ Donation failed: ${error.response?.data?.error || error.message}`)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Donors & Real-Time Donations</h2>
        <div className="space-x-2">
          <button
            onClick={() => setShowDonationForm(!showDonationForm)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {showDonationForm ? 'Cancel Donation' : '🩸 Make Donation'}
          </button>
          <button
            onClick={() => {
              setShowForm(!showForm)
              if (showForm) {
                setEditingId(null)
                setFormData({ name: '', age: '', gender: 'M', bloodGroup: 'A+', address: '', contact: '', disease: '' })
              }
            }}
            className="btn-primary"
          >
            {showForm ? 'Cancel' : 'Add Donor'}
          </button>
        </div>
      </div>

      {showDonationForm && (
        <div className="card mb-6 border-green-200 bg-green-50">
          <h3 className="text-lg font-semibold mb-4 text-green-800">🩸 Make Real-Time Donation</h3>
          <form onSubmit={handleDonationSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Select Donor:</label>
              <select
                className="form-input w-full"
                value={donationForm.donorId}
                onChange={(e) => setDonationForm({...donationForm, donorId: parseInt(e.target.value)})}
                required
              >
                <option value="">Choose donor...</option>
                {donors.map(donor => (
                  <option key={donor.DonorID} value={donor.DonorID}>
                    {donor.Name} ({donor.BloodGroup}) - Age {donor.Age}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Donation Type:</label>
              <select
                className="form-input w-full"
                value={donationForm.donationType}
                onChange={(e) => setDonationForm({...donationForm, donationType: e.target.value})}
              >
                <option value="Blood">Blood Donation</option>
                <option value="Organ">Organ Donation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Quantity:</label>
              <input
                type="number"
                className="form-input w-full"
                value={donationForm.quantity}
                onChange={(e) => setDonationForm({...donationForm, quantity: parseInt(e.target.value)})}
                min="1"
                max="5"
                required
              />
            </div>

            {donationForm.donationType === 'Organ' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Organ Type:</label>
                <select
                  className="form-input w-full"
                  value={donationForm.organType}
                  onChange={(e) => setDonationForm({...donationForm, organType: e.target.value})}
                  required
                >
                  <option value="">Select organ...</option>
                  <option value="Kidney">Kidney</option>
                  <option value="Liver">Liver</option>
                  <option value="Heart">Heart</option>
                  <option value="Lung">Lung</option>
                  <option value="Cornea">Cornea</option>
                  <option value="Bone">Bone</option>
                </select>
              </div>
            )}

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Notes:</label>
              <textarea
                className="form-input w-full"
                value={donationForm.notes}
                onChange={(e) => setDonationForm({...donationForm, notes: e.target.value})}
                rows="2"
                placeholder="Any additional notes..."
              />
            </div>

            <button type="submit" className="btn-primary col-span-2 bg-green-600 hover:bg-green-700">
              🚀 Process Donation (Real-Time Update)
            </button>
          </form>
        </div>
      )}

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Donor' : 'Add New Donor'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            <input
              type="number"
              placeholder="Age"
              className="form-input"
              value={formData.age}
              onChange={(e) => setFormData({...formData, age: e.target.value})}
            />
            <select
              className="form-input"
              value={formData.gender}
              onChange={(e) => setFormData({...formData, gender: e.target.value})}
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="Other">Other</option>
            </select>
            <select
              className="form-input"
              value={formData.bloodGroup}
              onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
            >
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Address"
              className="form-input"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
            <input
              type="tel"
              placeholder="Contact"
              className="form-input"
              value={formData.contact}
              onChange={(e) => setFormData({...formData, contact: e.target.value})}
            />
            <input
              type="text"
              placeholder="Disease (if any)"
              className="form-input col-span-2"
              value={formData.disease}
              onChange={(e) => setFormData({...formData, disease: e.target.value})}
            />
            <button type="submit" className="btn-primary col-span-2">
              {editingId ? 'Update Donor' : 'Add Donor'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Age</th>
                <th className="text-left p-2">Gender</th>
                <th className="text-left p-2">Blood Group</th>
                <th className="text-left p-2">Contact</th>
                <th className="text-left p-2">Address</th>
                <th className="text-left p-2">Disease</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {donors.map(donor => (
                <tr key={donor.DonorID} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-semibold">{donor.Name}</td>
                  <td className="p-2">{donor.Age}</td>
                  <td className="p-2">{donor.Gender}</td>
                  <td className="p-2 font-semibold text-red-600">{donor.BloodGroup}</td>
                  <td className="p-2">{donor.Contact}</td>
                  <td className="p-2">{donor.Address}</td>
                  <td className="p-2">{donor.Disease || 'None'}</td>
                  <td className="p-2">
                    <button
                      onClick={() => handleDonate(donor)}
                      className="bg-green-500 text-white px-2 py-1 rounded text-sm mr-1"
                      title="Make donation"
                    >
                      🩸 Donate
                    </button>
                    <button
                      onClick={() => handleEdit(donor)}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-sm mr-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(donor.DonorID)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Donors