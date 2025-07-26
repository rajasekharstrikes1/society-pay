import React, { useState, useEffect, useCallback } from 'react';
import { Settings as SettingsIcon, CreditCard, Bell, Shield, Database } from 'lucide-react';
import { platformSettingsService } from '../../services/firebase';

// Define the complete shape of your settings object
const initialSettings = {
  // Platform
  platformName: 'SocietyPay',
  supportEmail: 'support@societypay.com',
  supportPhone: '+91 98765 43210',
  maintenanceMode: false,
  allowRegistrations: true,
  maxCommunitiesPerAdmin: 1,
  // Payment
  razorpayKeyId: '',
  razorpayKeySecret: '',
  webhookSecret: '',
  commissionPercentage: 2.5,
  gstOnCommission: true,
  // Notifications
  emailNotifications: true,
  smsNotifications: false,
  whatsappNotifications: true,
  adminAlerts: true,
  paymentAlerts: true,
  // Security
  sessionTimeout: 30,
  passwordMinLength: 8,
  requireTwoFactor: false,
  allowPasswordReset: true,
  maxLoginAttempts: 5,
};

export default function SuperAdminSettings() {
  const [activeTab, setActiveTab] = useState('platform');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // Use a single state object for all settings
  const [settings, setSettings] = useState(initialSettings);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedSettings = await platformSettingsService.getPlatformSettings();
      if (fetchedSettings) {
        // Merge fetched settings with initial defaults
        setSettings(currentSettings => ({ ...currentSettings, ...fetchedSettings }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage('Error: Could not load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);
  
  // Generic handler for all input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Determine the value based on input type
    const val = type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value);
    
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: val,
    }));
  };

  // A single save function for all settings
  const handleSave = async () => {
    try {
      setSaving(true);
      await platformSettingsService.updatePlatformSettings(settings);
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error: Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'platform', label: 'Platform Settings', icon: SettingsIcon },
    { id: 'payment', label: 'Payment Gateway', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'database', label: 'Database', icon: Database },
  ];
  
  if (loading) {
    return (
        <div className="p-6 ml-64 flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
    );
  }

  return (
    <div className="p-6 ml-64">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-gray-600">Manage global platform configuration and settings</p>
        {message && (
          <div className={`mt-4 p-3 rounded-md ${
            message.includes('Error') 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Platform Settings */}
      {activeTab === 'platform' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Platform Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Platform Name" name="platformName" value={settings.platformName} onChange={handleInputChange} />
            <InputField label="Support Email" name="supportEmail" type="email" value={settings.supportEmail} onChange={handleInputChange} />
            <InputField label="Support Phone" name="supportPhone" type="tel" value={settings.supportPhone} onChange={handleInputChange} />
            <InputField label="Max Communities per Admin" name="maxCommunitiesPerAdmin" type="number" value={settings.maxCommunitiesPerAdmin} onChange={handleInputChange} />
          </div>

          <div className="mt-6 space-y-4">
            <CheckboxField label="Maintenance Mode" name="maintenanceMode" checked={settings.maintenanceMode} onChange={handleInputChange} />
            <CheckboxField label="Allow New Registrations" name="allowRegistrations" checked={settings.allowRegistrations} onChange={handleInputChange} />
          </div>

          <div className="mt-6">
            <button onClick={handleSave} disabled={saving} className="bg-secondary text-white px-6 py-2 rounded-md hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Payment Settings */}
      {activeTab === 'payment' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Gateway Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Razorpay Key ID" name="razorpayKeyId" value={settings.razorpayKeyId} onChange={handleInputChange} />
                <InputField label="Razorpay Key Secret" name="razorpayKeySecret" type="password" value={settings.razorpayKeySecret} onChange={handleInputChange} />
                <InputField label="Webhook Secret" name="webhookSecret" type="password" value={settings.webhookSecret} onChange={handleInputChange} />
                <InputField label="Commission Percentage (%)" name="commissionPercentage" type="number" step="0.1" value={settings.commissionPercentage} onChange={handleInputChange} />
            </div>
            <div className="mt-6">
                <CheckboxField label="Apply GST on Commission" name="gstOnCommission" checked={settings.gstOnCommission} onChange={handleInputChange} />
            </div>
            <div className="mt-6">
                <button onClick={handleSave} disabled={saving} className="bg-secondary text-white px-6 py-2 rounded-md hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed">
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Notification Configuration</h3>
            <div className="space-y-4">
                <CheckboxField label="Email Notifications" name="emailNotifications" checked={settings.emailNotifications} onChange={handleInputChange} />
                <CheckboxField label="SMS Notifications" name="smsNotifications" checked={settings.smsNotifications} onChange={handleInputChange} />
                <CheckboxField label="WhatsApp Notifications" name="whatsappNotifications" checked={settings.whatsappNotifications} onChange={handleInputChange} />
                <CheckboxField label="Admin Alerts" name="adminAlerts" checked={settings.adminAlerts} onChange={handleInputChange} />
                <CheckboxField label="Payment Alerts" name="paymentAlerts" checked={settings.paymentAlerts} onChange={handleInputChange} />
            </div>
            <div className="mt-6">
                <button onClick={handleSave} disabled={saving} className="bg-secondary text-white px-6 py-2 rounded-md hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed">
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Session Timeout (minutes)" name="sessionTimeout" type="number" value={settings.sessionTimeout} onChange={handleInputChange} />
                <InputField label="Password Minimum Length" name="passwordMinLength" type="number" value={settings.passwordMinLength} onChange={handleInputChange} />
                <InputField label="Max Login Attempts" name="maxLoginAttempts" type="number" value={settings.maxLoginAttempts} onChange={handleInputChange} />
            </div>
            <div className="mt-6 space-y-4">
                <CheckboxField label="Require Two-Factor Authentication" name="requireTwoFactor" checked={settings.requireTwoFactor} onChange={handleInputChange} />
                <CheckboxField label="Allow Password Reset" name="allowPasswordReset" checked={settings.allowPasswordReset} onChange={handleInputChange} />
            </div>
            <div className="mt-6">
                <button onClick={handleSave} disabled={saving} className="bg-secondary text-white px-6 py-2 rounded-md hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed">
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
      )}

      {/* Database Settings (No functionality, just UI) */}
      {activeTab === 'database' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Database Management</h3>
            <p className="text-sm text-gray-600 mb-4">
                Critical database operations like backups and cleanup should be handled by secure, server-side Cloud Functions, not directly from the client.
            </p>
          {/* Your informational UI for this tab */}
        </div>
      )}
    </div>
  );
}

// --- Helper sub-components to reduce repetition ---
const InputField = ({ label, name, type = 'text', value, onChange, step }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            step={step}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-transparent"
        />
    </div>
);

const CheckboxField = ({ label, name, checked, onChange }) => (
    <label className="flex items-center">
        <input
            type="checkbox"
            name={name}
            checked={checked}
            onChange={onChange}
            className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
        />
        <span className="ml-2 text-sm font-medium text-gray-700">{label}</span>
    </label>
);