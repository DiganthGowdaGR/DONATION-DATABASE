import React, { useState, useEffect } from 'react'
import { donationsAPI, donorsAPI, patientsAPI } from '../api'

const Functions = () => {
  const [activeTab, setActiveTab] = useState('compatibility')
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(false)
  const [donors, setDonors] = useState([])
  const [patients, setPatients] = useState([])

  // Form states for different functions
  const [compatibilityForm, setCompatibilityForm] = useState({
    donorBlood: 'O-',
    patientBlood: 'A+'
  })
  const [riskForm, setRiskForm] = useState({
    age: 25,
    disease: 'none'
  })
  const [valueForm, setValueForm] = useState({
    type: 'BLOOD',
    quantity: 10,
    item: 'O-'
  })
  const [priorityForm, setPriorityForm] = useState({
    days: 15,
    bloodGroup: 'A+',
    units: 5
  })
  const [realFunctionForms, setRealFunctionForms] = useState({
    donorName: 'Ashok',
    patientName: 'Suresh',
    bankName: 'City Blood Bank'
  })

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

  const callFunction = async (endpoint, params = {}) => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:3001/api/donations/functions/${endpoint}`)
      const data = await response.json()
      setResults(prev => ({ ...prev, [activeTab]: data }))
    } catch (error) {
      console.error('Error calling function:', error)
    } finally {
      setLoading(false)
    }
  }

  const testCompatibilityScore = () => {
    callFunction(`compatibility-score/${compatibilityForm.donorBlood}/${compatibilityForm.patientBlood}`)
  }

  const testDonorRisk = () => {
    callFunction(`donor-risk/${riskForm.age}/${encodeURIComponent(riskForm.disease)}`)
  }

  const testInventoryValue = () => {
    callFunction(`inventory-value/${valueForm.type}/${valueForm.quantity}/${encodeURIComponent(valueForm.item)}`)
  }

  const testPatientPriority = () => {
    callFunction(`patient-priority/${priorityForm.days}/${priorityForm.bloodGroup}/${priorityForm.units}`)
  }

  const testRealDonorSummary = () => {
    callFunction(`donor-summary/${encodeURIComponent(realFunctionForms.donorName)}`)
  }

  const testTotalInventoryValue = () => {
    callFunction('total-inventory-value')
  }

  const testPatientUrgency = () => {
    callFunction(`patient-urgency/${encodeURIComponent(realFunctionForms.patientName)}`)
  }

  const testBloodBankStatus = () => {
    callFunction(`blood-bank-status/${encodeURIComponent(realFunctionForms.bankName)}`)
  }

  const testDonationTrends = () => {
    callFunction('donation-trends')
  }

  const testEnhancedCompatibility = async () => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:3001/api/donations/functions/enhanced-compatibility/A+`)
      const data = await response.json()
      setResults(prev => ({ ...prev, enhanced: data }))
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'compatibility', label: '🩸 Compatibility Score', test: testCompatibilityScore },
    { id: 'risk', label: '⚠️ Donor Risk Level', test: testDonorRisk },
    { id: 'priority', label: '🚨 Patient Priority', test: testPatientPriority },
    { id: 'donor-summary', label: '👤 Real Donor Summary', test: testRealDonorSummary },
    { id: 'patient-urgency', label: '🚨 Patient Urgency', test: testPatientUrgency },
    { id: 'bank-status', label: '🏥 Blood Bank Status', test: testBloodBankStatus },
    { id: 'trends', label: '📈 Donation Trends', test: testDonationTrends }
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">⚡ MySQL Functions Dashboard</h2>
      
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-green-800 mb-2">What are MySQL Functions?</h3>
        <p className="text-green-700 text-sm">
          MySQL Functions are reusable code blocks that return a single value and can be used in SQL queries. 
          Unlike procedures, functions can be called within SELECT statements and provide calculated results.
        </p>
      </div>

      <div className="flex space-x-1 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              tab.test()
            }}
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-600">Executing function...</p>
        </div>
      )}

      {/* Compatibility Score Tab */}
      {activeTab === 'compatibility' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">🩸 Blood Compatibility Score Calculator</h3>
          
          <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
            <strong>Function:</strong> <code>CalculateBloodCompatibilityScore(donor_blood, patient_blood)</code><br/>
            <strong>Purpose:</strong> Returns a numerical score (0-100) indicating blood compatibility between donor and patient.
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Donor Blood Group:</label>
              <select
                className="form-input w-full"
                value={compatibilityForm.donorBlood}
                onChange={(e) => setCompatibilityForm({...compatibilityForm, donorBlood: e.target.value})}
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Patient Blood Group:</label>
              <select
                className="form-input w-full"
                value={compatibilityForm.patientBlood}
                onChange={(e) => setCompatibilityForm({...compatibilityForm, patientBlood: e.target.value})}
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={testCompatibilityScore} className="btn-primary mb-4">
            Calculate Compatibility Score
          </button>

          {results.compatibility && (
            <div className="bg-blue-50 p-4 rounded">
              <h4 className="font-semibold text-blue-800 mb-2">Result:</h4>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {results.compatibility.compatibilityScore}/100
              </div>
              <div className="text-sm text-blue-700">
                Compatibility between {compatibilityForm.donorBlood} donor and {compatibilityForm.patientBlood} patient
              </div>
            </div>
          )}
        </div>
      )}

      {/* Donor Risk Tab */}
      {activeTab === 'risk' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">⚠️ Donor Risk Level Assessment</h3>
          
          <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
            <strong>Function:</strong> <code>GetDonorRiskLevel(age, disease_history)</code><br/>
            <strong>Purpose:</strong> Assesses donor health risk based on age and medical history for screening purposes.
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Donor Age:</label>
              <input
                type="number"
                className="form-input w-full"
                value={riskForm.age}
                onChange={(e) => setRiskForm({...riskForm, age: parseInt(e.target.value)})}
                min="1" max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Disease History:</label>
              <select
                className="form-input w-full"
                value={riskForm.disease}
                onChange={(e) => setRiskForm({...riskForm, disease: e.target.value})}
              >
                <option value="none">None</option>
                <option value="diabetes">Diabetes</option>
                <option value="heart disease">Heart Disease</option>
                <option value="hypertension">Hypertension</option>
                <option value="asthma">Asthma</option>
                <option value="cancer">Cancer</option>
              </select>
            </div>
          </div>

          <button onClick={testDonorRisk} className="btn-primary mb-4">
            Assess Risk Level
          </button>

          {results.risk && (
            <div className={`p-4 rounded ${
              results.risk.riskLevel === 'LOW_RISK' ? 'bg-green-50' :
              results.risk.riskLevel === 'MODERATE_RISK' ? 'bg-yellow-50' : 'bg-red-50'
            }`}>
              <h4 className="font-semibold mb-2">Risk Assessment Result:</h4>
              <div className={`text-2xl font-bold mb-2 ${
                results.risk.riskLevel === 'LOW_RISK' ? 'text-green-600' :
                results.risk.riskLevel === 'MODERATE_RISK' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {results.risk.riskLevel.replace('_', ' ')}
              </div>
              <div className="text-sm">
                Age: {riskForm.age} years, Disease: {riskForm.disease}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inventory Value Tab */}
      {activeTab === 'value' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">💰 Inventory Value Calculator</h3>
          
          <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
            <strong>Function:</strong> <code>CalculateInventoryValue(item_type, quantity, item_name)</code><br/>
            <strong>Purpose:</strong> Calculates monetary value of blood/organ inventory for financial tracking.
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Item Type:</label>
              <select
                className="form-input w-full"
                value={valueForm.type}
                onChange={(e) => setValueForm({...valueForm, type: e.target.value})}
              >
                <option value="BLOOD">Blood</option>
                <option value="ORGAN">Organ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Quantity:</label>
              <input
                type="number"
                className="form-input w-full"
                value={valueForm.quantity}
                onChange={(e) => setValueForm({...valueForm, quantity: parseInt(e.target.value)})}
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {valueForm.type === 'BLOOD' ? 'Blood Group:' : 'Organ Type:'}
              </label>
              {valueForm.type === 'BLOOD' ? (
                <select
                  className="form-input w-full"
                  value={valueForm.item}
                  onChange={(e) => setValueForm({...valueForm, item: e.target.value})}
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              ) : (
                <select
                  className="form-input w-full"
                  value={valueForm.item}
                  onChange={(e) => setValueForm({...valueForm, item: e.target.value})}
                >
                  {['Heart', 'Liver', 'Kidney', 'Lung', 'Pancreas', 'Cornea', 'Bone'].map(organ => (
                    <option key={organ} value={organ}>{organ}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <button onClick={testInventoryValue} className="btn-primary mb-4">
            Calculate Value
          </button>

          {results.value && (
            <div className="bg-green-50 p-4 rounded">
              <h4 className="font-semibold text-green-800 mb-2">Inventory Value:</h4>
              <div className="text-3xl font-bold text-green-600 mb-2">
                ₹{parseFloat(results.value.inventoryValue).toLocaleString()}
              </div>
              <div className="text-sm text-green-700">
                {valueForm.quantity} units of {valueForm.item} {valueForm.type.toLowerCase()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Patient Priority Tab */}
      {activeTab === 'priority' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">🚨 Patient Priority Score Calculator</h3>
          
          <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
            <strong>Function:</strong> <code>GetPatientWaitingPriority(days_waiting, blood_group, compatible_units)</code><br/>
            <strong>Purpose:</strong> Calculates patient priority score (1-100) based on waiting time, blood rarity, and availability.
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Days Waiting:</label>
              <input
                type="number"
                className="form-input w-full"
                value={priorityForm.days}
                onChange={(e) => setPriorityForm({...priorityForm, days: parseInt(e.target.value)})}
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Blood Group:</label>
              <select
                className="form-input w-full"
                value={priorityForm.bloodGroup}
                onChange={(e) => setPriorityForm({...priorityForm, bloodGroup: e.target.value})}
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Compatible Units Available:</label>
              <input
                type="number"
                className="form-input w-full"
                value={priorityForm.units}
                onChange={(e) => setPriorityForm({...priorityForm, units: parseInt(e.target.value)})}
                min="0"
              />
            </div>
          </div>

          <button onClick={testPatientPriority} className="btn-primary mb-4">
            Calculate Priority Score
          </button>

          {results.priority && (
            <div className={`p-4 rounded ${
              results.priority.priorityScore >= 80 ? 'bg-red-50' :
              results.priority.priorityScore >= 60 ? 'bg-orange-50' :
              results.priority.priorityScore >= 40 ? 'bg-yellow-50' : 'bg-green-50'
            }`}>
              <h4 className="font-semibold mb-2">Priority Score:</h4>
              <div className={`text-3xl font-bold mb-2 ${
                results.priority.priorityScore >= 80 ? 'text-red-600' :
                results.priority.priorityScore >= 60 ? 'text-orange-600' :
                results.priority.priorityScore >= 40 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {results.priority.priorityScore}/100
              </div>
              <div className="text-sm">
                {priorityForm.days} days waiting • {priorityForm.bloodGroup} blood • {priorityForm.units} units available
              </div>
            </div>
          )}
        </div>
      )}

      {/* Real Donor Summary Tab */}
      {activeTab === 'donor-summary' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">👤 Real Donor Summary (Database-Driven)</h3>
          
          <div className="bg-green-50 p-3 rounded mb-4 text-sm">
            <strong>Function:</strong> <code>GetDonorSummaryByName(donor_name)</code><br/>
            <strong>Purpose:</strong> Generates complete donor summary by looking up actual data in database. Just provide name!
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Donor from Database:</label>
            <select
              className="form-input w-full"
              value={realFunctionForms.donorName}
              onChange={(e) => setRealFunctionForms({...realFunctionForms, donorName: e.target.value})}
            >
              {donors.map(donor => (
                <option key={donor.DonorID} value={donor.Name}>
                  {donor.Name} ({donor.BloodGroup}) - Age {donor.Age}
                </option>
              ))}
            </select>
          </div>

          <button onClick={testRealDonorSummary} className="btn-primary mb-4">
            Generate Real Donor Summary
          </button>

          {results['donor-summary'] && (
            <div className="bg-green-50 p-4 rounded">
              <h4 className="font-semibold text-green-800 mb-2">Database-Generated Summary:</h4>
              <pre className="text-sm text-green-700 whitespace-pre-wrap font-mono">
                {results['donor-summary'].donorSummary}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Total Inventory Value Tab */}
      {activeTab === 'total-value' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">💎 Total Inventory Value (Database-Driven)</h3>
          
          <div className="bg-green-50 p-3 rounded mb-4 text-sm">
            <strong>Function:</strong> <code>GetTotalInventoryValue()</code><br/>
            <strong>Purpose:</strong> Calculates total monetary value of ALL inventory in the system from database.
          </div>

          <button onClick={testTotalInventoryValue} className="btn-primary mb-4">
            Calculate Total System Value
          </button>

          {results['total-value'] && (
            <div className="bg-green-50 p-4 rounded">
              <h4 className="font-semibold text-green-800 mb-2">Total System Inventory Value:</h4>
              <div className="text-4xl font-bold text-green-600 mb-2">
                ₹{parseFloat(results['total-value'].totalValue).toLocaleString()}
              </div>
              <div className="text-sm text-green-700">
                Combined value of all blood and organ inventory in the system
              </div>
            </div>
          )}
        </div>
      )}

      {/* Patient Urgency Tab */}
      {activeTab === 'patient-urgency' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">🚨 Patient Urgency Analysis (Database-Driven)</h3>
          
          <div className="bg-green-50 p-3 rounded mb-4 text-sm">
            <strong>Function:</strong> <code>GetPatientUrgencyByName(patient_name)</code><br/>
            <strong>Purpose:</strong> Calculates patient urgency score by looking up actual patient data and inventory.
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Patient from Database:</label>
            <select
              className="form-input w-full"
              value={realFunctionForms.patientName}
              onChange={(e) => setRealFunctionForms({...realFunctionForms, patientName: e.target.value})}
            >
              {patients.map(patient => (
                <option key={patient.PatientID} value={patient.Name}>
                  {patient.Name} ({patient.BloodGroup}) - {patient.DateOfIntake ? new Date(patient.DateOfIntake).toLocaleDateString() : 'No date'}
                </option>
              ))}
            </select>
          </div>

          <button onClick={testPatientUrgency} className="btn-primary mb-4">
            Calculate Patient Urgency
          </button>

          {results['patient-urgency'] && (
            <div className={`p-4 rounded ${
              results['patient-urgency'].urgencyScore >= 80 ? 'bg-red-50' :
              results['patient-urgency'].urgencyScore >= 60 ? 'bg-orange-50' :
              results['patient-urgency'].urgencyScore >= 40 ? 'bg-yellow-50' : 'bg-green-50'
            }`}>
              <h4 className="font-semibold mb-2">Patient Urgency Score:</h4>
              <div className={`text-3xl font-bold mb-2 ${
                results['patient-urgency'].urgencyScore >= 80 ? 'text-red-600' :
                results['patient-urgency'].urgencyScore >= 60 ? 'text-orange-600' :
                results['patient-urgency'].urgencyScore >= 40 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {results['patient-urgency'].urgencyScore}/100
              </div>
              <div className="text-sm">
                Calculated from real database data for {realFunctionForms.patientName}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Blood Bank Status Tab */}
      {activeTab === 'bank-status' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">🏥 Blood Bank Status Report (Database-Driven)</h3>
          
          <div className="bg-green-50 p-3 rounded mb-4 text-sm">
            <strong>Function:</strong> <code>GetBloodBankStatus(bank_name)</code><br/>
            <strong>Purpose:</strong> Generates comprehensive status report for a blood bank from database.
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Blood Bank Name:</label>
            <input
              type="text"
              className="form-input w-full"
              value={realFunctionForms.bankName}
              onChange={(e) => setRealFunctionForms({...realFunctionForms, bankName: e.target.value})}
              placeholder="Enter blood bank name"
            />
          </div>

          <button onClick={testBloodBankStatus} className="btn-primary mb-4">
            Generate Bank Status Report
          </button>

          {results['bank-status'] && (
            <div className="bg-blue-50 p-4 rounded">
              <h4 className="font-semibold text-blue-800 mb-2">Blood Bank Status Report:</h4>
              <pre className="text-sm text-blue-700 whitespace-pre-wrap font-mono">
                {results['bank-status'].bankStatus}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Donation Trends Tab */}
      {activeTab === 'trends' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">📈 Donation Trends Analysis (Database-Driven)</h3>
          
          <div className="bg-green-50 p-3 rounded mb-4 text-sm">
            <strong>Function:</strong> <code>GetDonationTrendAnalysis()</code><br/>
            <strong>Purpose:</strong> Analyzes donation patterns from the last 30 days using real database data.
          </div>

          <button onClick={testDonationTrends} className="btn-primary mb-4">
            Generate Trend Analysis
          </button>

          {results.trends && (
            <div className="bg-purple-50 p-4 rounded">
              <h4 className="font-semibold text-purple-800 mb-2">30-Day Donation Trend Analysis:</h4>
              <pre className="text-sm text-purple-700 whitespace-pre-wrap font-mono">
                {results.trends.trendAnalysis}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Report Tab */}
      {activeTab === 'enhanced' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">🔬 Enhanced Compatibility Report</h3>
          
          <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
            <strong>Multiple Functions:</strong> Uses all functions together in a single query<br/>
            <strong>Purpose:</strong> Demonstrates how functions can be combined for comprehensive analysis.
          </div>

          <button onClick={testEnhancedCompatibility} className="btn-primary mb-4">
            Generate Enhanced Report for A+ Patient
          </button>

          {results.enhanced && (
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Donor</th>
                    <th className="text-left p-2">Blood Group</th>
                    <th className="text-left p-2">Age</th>
                    <th className="text-left p-2">Units</th>
                    <th className="text-left p-2">Compatibility Score</th>
                    <th className="text-left p-2">Risk Level</th>
                    <th className="text-left p-2">Inventory Value</th>
                  </tr>
                </thead>
                <tbody>
                  {results.enhanced.map((donor, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-semibold">{donor.DonorName}</td>
                      <td className="p-2 text-red-600 font-semibold">{donor.DonorBloodGroup}</td>
                      <td className="p-2">{donor.Age}</td>
                      <td className="p-2 text-blue-600 font-semibold">{donor.AvailableUnits}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          donor.CompatibilityScore === 100 ? 'bg-green-100 text-green-800' :
                          donor.CompatibilityScore >= 85 ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {donor.CompatibilityScore}/100
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          donor.RiskLevel === 'LOW_RISK' ? 'bg-green-100 text-green-800' :
                          donor.RiskLevel === 'MODERATE_RISK' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {donor.RiskLevel.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-2 text-green-600 font-semibold">
                        ₹{parseFloat(donor.InventoryValue).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Functions