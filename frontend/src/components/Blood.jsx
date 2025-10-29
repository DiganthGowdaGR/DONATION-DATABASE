import React, { useState, useEffect } from 'react'
import { bloodAPI } from '../api'

const Blood = () => {
  const [bloodInventory, setBloodInventory] = useState([])
  const [bloodBanks, setBloodBanks] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [newQuantity, setNewQuantity] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    bloodGroup: 'A+',
    quantity: '',
    bankID: ''
  })

  useEffect(() => {
    fetchBloodInventory()
    fetchBloodBanks()
    
    // Listen for inventory updates from donations
    const handleInventoryUpdate = () => {
      fetchBloodInventory()
    }
    
    window.addEventListener('inventoryUpdated', handleInventoryUpdate)
    
    // Auto-refresh every 5 seconds for real-time updates
    const interval = setInterval(fetchBloodInventory, 5000)
    
    return () => {
      window.removeEventListener('inventoryUpdated', handleInventoryUpdate)
      clearInterval(interval)
    }
  }, [])

  const fetchBloodInventory = async () => {
    try {
      const response = await bloodAPI.getInventory()
      setBloodInventory(response.data)
    } catch (error) {
      console.error('Error fetching blood inventory:', error)
    }
  }

  const fetchBloodBanks = async () => {
    try {
      const response = await bloodAPI.getBanks()
      setBloodBanks(response.data)
    } catch (error) {
      console.error('Error fetching blood banks:', error)
    }
  }

  const handleUpdate = async (bloodId) => {
    try {
      await bloodAPI.updateInventory(bloodId, { quantity: parseInt(newQuantity) })
      setEditingId(null)
      setNewQuantity('')
      fetchBloodInventory()
    } catch (error) {
      console.error('Error updating blood inventory:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await bloodAPI.create(formData)
      setFormData({ bloodGroup: 'A+', quantity: '', bankID: '' })
      setShowForm(false)
      fetchBloodInventory()
    } catch (error) {
      console.error('Error adding blood record:', error)
    }
  }

  const getStockLevel = (quantity) => {
    if (quantity < 10) return 'text-red-600 font-bold'
    if (quantity < 20) return 'text-orange-600 font-semibold'
    return 'text-green-600'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Blood Inventory (Real-Time)</h2>
        <div className="space-x-2">
          <button
            onClick={fetchBloodInventory}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            {showForm ? 'Cancel' : 'Add Blood Record'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Add New Blood Record</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
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
              type="number"
              placeholder="Quantity"
              className="form-input"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              required
            />
            <select
              className="form-input"
              value={formData.bankID}
              onChange={(e) => setFormData({...formData, bankID: e.target.value})}
              required
            >
              <option value="">Select Blood Bank</option>
              {bloodBanks.map(bank => (
                <option key={bank.BankID} value={bank.BankID}>
                  {bank.Name} - {bank.Location}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-primary col-span-3">
              Add Blood Record
            </button>
          </form>
        </div>
      )}
      
      <div className="card mb-6">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Blood Group</th>
                <th className="text-left p-2">Quantity</th>
                <th className="text-left p-2">Bank Name</th>
                <th className="text-left p-2">Location</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bloodInventory.map(blood => (
                <tr key={blood.BloodID} className="border-b">
                  <td className="p-2 font-semibold text-red-600">{blood.BloodGroup}</td>
                  <td className={`p-2 ${getStockLevel(blood.Quantity)}`}>
                    {blood.Quantity} units
                  </td>
                  <td className="p-2">{blood.BankName}</td>
                  <td className="p-2">{blood.Location}</td>
                  <td className="p-2">
                    {editingId === blood.BloodID ? (
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          className="form-input w-20"
                          value={newQuantity}
                          onChange={(e) => setNewQuantity(e.target.value)}
                        />
                        <button
                          onClick={() => handleUpdate(blood.BloodID)}
                          className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null)
                            setNewQuantity('')
                          }}
                          className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(blood.BloodID)
                          setNewQuantity(blood.Quantity.toString())
                        }}
                        className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                      >
                        Update
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Stock Status Legend</h3>
        <div className="flex space-x-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-600 rounded mr-2"></div>
            <span>Critical (&lt; 10 units)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-600 rounded mr-2"></div>
            <span>Low (10-19 units)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-600 rounded mr-2"></div>
            <span>Good (20+ units)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Blood