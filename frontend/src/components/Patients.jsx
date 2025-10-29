import React, { useState, useEffect } from 'react'
import { patientsAPI } from '../api'

const Patients = () => {
  const [patients, setPatients] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'M',
    bloodGroup: 'A+',
    address: '',
    contact: '',
    dateOfIntake: new Date().toISOString().split('T')[0],
    preferredBank: 'City Blood Bank'
  })
  const [editingId, setEditingId] = useState(null)
  const [bloodBanks] = useState(['City Blood Bank', 'Green Health Bank'])

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const response = await patientsAPI.getAll()
      setPatients(response.data)
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await patientsAPI.update(editingId, formData)
        setEditingId(null)
      } else {
        await patientsAPI.create(formData)
      }
      setFormData({ name: '', age: '', gender: 'M', bloodGroup: 'A+', address: '', contact: '', dateOfIntake: new Date().toISOString().split('T')[0] })
      setShowForm(false)
      fetchPatients()
    } catch (error) {
      console.error('Error saving patient:', error)
    }
  }

  const handleEdit = (patient) => {
    setFormData({
      name: patient.Name,
      age: patient.Age,
      gender: patient.Gender,
      bloodGroup: patient.BloodGroup,
      address: patient.Address,
      contact: patient.Contact,
      dateOfIntake: patient.DateOfIntake ? patient.DateOfIntake.split('T')[0] : new Date().toISOString().split('T')[0],
      preferredBank: patient.PreferredBank || 'City Blood Bank'
    })
    setEditingId(patient.PatientID)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await patientsAPI.delete(id)
        fetchPatients()
      } catch (error) {
        console.error('Error deleting patient:', error)
      }
    }
  }



  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Patients</h2>
        <button
          onClick={() => {
            setShowForm(!showForm)
            if (showForm) {
              setEditingId(null)
              setFormData({ name: '', age: '', gender: 'M', bloodGroup: 'A+', address: '', contact: '', dateOfIntake: new Date().toISOString().split('T')[0] })
            }
          }}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : 'Add Patient'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Patient' : 'Add New Patient'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Age"
              className="form-input"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            />
            <select
              className="form-input"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="Other">Other</option>
            </select>
            <select
              className="form-input"
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <input
              type="tel"
              placeholder="Contact"
              className="form-input"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            />
            <input
              type="date"
              className="form-input"
              value={formData.dateOfIntake}
              onChange={(e) => setFormData({ ...formData, dateOfIntake: e.target.value })}
            />
            <select
              className="form-input"
              value={formData.preferredBank}
              onChange={(e) => setFormData({ ...formData, preferredBank: e.target.value })}
            >
              <option value="City Blood Bank">City Blood Bank</option>
              <option value="Green Health Bank">Green Health Bank</option>
            </select>
            <button type="submit" className="btn-primary col-span-2">
              {editingId ? 'Update Patient' : 'Add Patient'}
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
                <th className="text-left p-2">Date of Intake</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(patient => (
                <tr key={patient.PatientID} className="border-b">
                  <td className="p-2">{patient.Name}</td>
                  <td className="p-2">{patient.Age}</td>
                  <td className="p-2">{patient.Gender}</td>
                  <td className="p-2">{patient.BloodGroup}</td>
                  <td className="p-2">{patient.Contact}</td>
                  <td className="p-2">{patient.Address}</td>
                  <td className="p-2">{patient.DateOfIntake ? new Date(patient.DateOfIntake).toLocaleDateString() : 'N/A'}</td>
                  <td className="p-2">
                    <button
                      onClick={() => handleEdit(patient)}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-sm mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(patient.PatientID)}
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

export default Patients