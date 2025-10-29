import React, { useState } from 'react'
import Donors from './components/Donors'
import Patients from './components/Patients'
import Blood from './components/Blood'
import Organs from './components/Organs'
import Donations from './components/Donations'
import Procedures from './components/Procedures'
import Functions from './components/Functions'

function App() {
  const [activeTab, setActiveTab] = useState('donors')

  const tabs = [
    { id: 'donors', label: 'Donors', component: Donors },
    { id: 'patients', label: 'Patients', component: Patients },
    { id: 'blood', label: 'Blood Inventory', component: Blood },
    { id: 'organs', label: 'Organ Inventory', component: Organs },
    { id: 'donations', label: 'Donations', component: Donations },
    { id: 'procedures', label: 'Stored Procedures', component: Procedures },
    { id: 'functions', label: 'MySQL Functions', component: Functions }
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-red-600 text-white p-4">
        <h1 className="text-2xl font-bold">Blood & Organ Donation Management</h1>
      </header>
      
      <nav className="bg-white shadow-md">
        <div className="flex space-x-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="p-6">
        {ActiveComponent && <ActiveComponent />}
      </main>
    </div>
  )
}

export default App