import React, { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { motion } from 'framer-motion'
import { Globe, Database } from 'lucide-react'
import toast from 'react-hot-toast'

const Settings = () => {
  const [settings, setSettings] = useState({
    companyName: 'EmPay HRMS',
    companyEmail: 'admin@empay.com',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    sessionTimeout: 30
  })
  
  const handleSave = (section) => {
    toast.success(`${section} settings saved successfully!`)
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Sidebar />
      <Header />
      
      <main className="pt-16 p-6" style={{ marginLeft: 220 }}>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
            <p className="text-gray-600">Manage system configuration and preferences</p>
          </div>
          
          <div className="space-y-6">
            {/* Company Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-800">Company Settings</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Email</label>
                  <input
                    type="email"
                    value={settings.companyEmail}
                    onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="md:col-span-2 mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden">
                      {localStorage.getItem('empay_company_logo') ? (
                        <img src={localStorage.getItem('empay_company_logo')} alt="logo" className="w-full h-full object-contain p-2" />
                      ) : (
                        <div className="text-xs text-gray-400 font-bold">NO LOGO</div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <input 
                        type="file" 
                        id="logo-upload" 
                        hidden 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              localStorage.setItem('empay_company_logo', ev.target.result);
                              setSettings({...settings}); // trigger re-render
                              toast.success('Logo updated!');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <div className="flex gap-3">
                        <button 
                          onClick={() => document.getElementById('logo-upload').click()}
                          className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
                        >
                          Change Logo
                        </button>
                        {localStorage.getItem('empay_company_logo') && (
                          <button 
                            onClick={() => {
                              localStorage.removeItem('empay_company_logo');
                              setSettings({...settings});
                              toast.success('Logo removed!');
                            }}
                            className="text-sm font-bold text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400">Recommended: Square PNG/SVG under 1MB</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleSave('Company')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
            
            {/* System Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-800">System Settings</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Asia/Kolkata">IST (UTC+5:30)</option>
                    <option value="America/New_York">EST (UTC-5)</option>
                    <option value="Europe/London">GMT (UTC+0)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleSave('System')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Settings