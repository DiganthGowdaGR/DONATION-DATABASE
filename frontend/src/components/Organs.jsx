import React, { useState, useEffect } from 'react'
import { organsAPI } from '../api'

const Organs = () => {
  const [organInventory, setOrganInventory] = useState([])
  const [organBanks, setOrganBanks] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [newQuantity, setNewQuantity] = useState('')
  const [newCondition, setNewCondition] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    organType: '',
    organCondition: 'Good',
    organBankID: '',
    quantity: ''
  })

  useEffect(() => {
    fetchOrganInventory()
    fetchOrganBanks()
    
    // Listen for inventory updates from donations
    const handleInventoryUpdate = () => {
      fetchOrganInventory()
    }
    
    window.addEventListener('inventoryUpdated', handleInventoryUpdate)
    
    // Auto-refresh every 5 seconds for real-time updates
    const interval = setInterval(fetchOrganInventory, 5000)
    
    return () => {
      window.removeEventListener('inventoryUpdated', handleInventoryUpdate)
      clearInterval(interval)
    }
  }, [])

  const fetchOrganInventory = async () => {
    try {
      const response = await organsAPI.getInventory()
      setOrganInventory(response.data)
    } catch (error) {
      console.error('Error fetching organ inventory:', error)
    }
  }

  const fetchOrganBanks = async () => {
    try {
      const response = await organsAPI.getBanks()
      setOrganBanks(response.data)
    } catch (error) {
      console.error('Error fetching organ banks:', error)
    }
  }

  const handleUpdate = async (organId) => {
    try {
      await organsAPI.updateInventory(organId, { 
        quantity: parseInt(newQuantity),
        organCondition: newCondition
      })
      setEditingId(null)
      setNewQuantity('')
      setNewCondition('')
      fetchOrganInventory()
    } catch (error) {
      console.error('Error updating organ inventory:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await organsAPI.create(formData)
      setFormData({ organType: '', organCondition: 'Good', organBankID: '', quantity: '' })
      setShowForm(false)
      fetchOrganInventory()
    } catch (error) {
      console.error('Error adding organ record:', error)
    }
  }

  const getAvailabilityColor = (quantity) => {
    if (quantity === 0) return 'text-red-600 font-bold'
    if (quantity < 3) return 'text-orange-600 font-semibold'
    return 'text-green-600'
  }

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'Excellent': return 'text-green-600 font-semibold'
      case 'Good': return 'text-blue-600'
      case 'Fair': return 'text-yellow-600'
      case 'Poor': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getOrganIcon = (organType) => {
    const icons = {
      'Heart': '❤️',
      'Liver': '🫀',
      'Kidney': '🫘',
      'Lung': '🫁',
      'Pancreas': '🥞',
      'Cornea': '👁️',
      'Bone': '🦴'
    }
    return icons[organType] || '🏥'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Organ Inventory (Real-Time)</h2>
        <div className="space-x-2">
          <button
            onClick={fetchOrganInventory}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            {showForm ? 'Cancel' : 'Add Organ Record'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Add New Organ Record</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Organ Type"
              className="form-input"
              value={formData.organType}
              onChange={(e) => setFormData({...formData, organType: e.target.value})}
              required
            />
            <select
              className="form-input"
              value={formData.organCondition}
              onChange={(e) => setFormData({...formData, organCondition: e.target.value})}
            >
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
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
              value={formData.organBankID}
              onChange={(e) => setFormData({...formData, organBankID: e.target.value})}
              required
            >
              <option value="">Select Organ Bank</option>
              {organBanks.map(bank => (
                <option key={bank.OrganBankID} value={bank.OrganBankID}>
                  {bank.Name} - {bank.Location}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-primary col-span-2">
              Add Organ Record
            </button>
          </form>
        </div>
      )}
      
      <div className="card mb-6">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Organ Type</th>
                <th className="text-left p-2">Condition</th>
                <th className="text-left p-2">Quantity</th>
                <th className="text-left p-2">Bank Name</th>
                <th className="text-left p-2">Location</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {organInventory.map(organ => (
                <tr key={organ.OrganID} className="border-b">
                  <td className="p-2 font-semibold">
                    {getOrganIcon(organ.OrganType)} {organ.OrganType}
                  </td>
                  <td className={`p-2 ${getConditionColor(organ.OrganCondition)}`}>
                    {organ.OrganCondition}
                  </td>
                  <td className={`p-2 ${getAvailabilityColor(organ.Quantity)}`}>
                    {organ.Quantity} available
                  </td>
                  <td className="p-2">{organ.BankName}</td>
                  <td className="p-2">{organ.Location}</td>
                  <td className="p-2">
                    {editingId === organ.OrganID ? (
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          className="form-input w-16"
                          value={newQuantity}
                          onChange={(e) => setNewQuantity(e.target.value)}
                        />
                        <select
                          className="form-input w-20"
                          value={newCondition}
                          onChange={(e) => setNewCondition(e.target.value)}
                        >
                          <option value="Excellent">Excellent</option>
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                          <option value="Poor">Poor</option>
                        </select>
                        <button
                          onClick={() => handleUpdate(organ.OrganID)}
                          className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null)
                            setNewQuantity('')
                            setNewCondition('')
                          }}
                          className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(organ.OrganID)
                          setNewQuantity(organ.Quantity.toString())
                          setNewCondition(organ.OrganCondition)
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
        <h3 className="text-lg font-semibold mb-4">Availability Status</h3>
        <div className="flex space-x-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-600 rounded mr-2"></div>
            <span>Not Available (0)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-600 rounded mr-2"></div>
            <span>Limited (1-2)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-600 rounded mr-2"></div>
            <span>Available (3+)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Organs