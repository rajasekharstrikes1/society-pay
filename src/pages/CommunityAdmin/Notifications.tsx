import React, { useState, useEffect, useCallback } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { tenantService } from '../../services/firebase';
import { maintenanceNotificationService } from '../../services/maintenanceNotification';
import { Tenant } from '../../types';

// FIXED: Added proper type for message type instead of using 'any'
type MessageType = 'maintenance_reminder' | 'payment_confirmation' | 'general';

interface NotificationHistory {
  id: string;
  type: MessageType;
  recipients: number;
  sentAt: Date;
  status: 'sent' | 'failed' | 'pending';
  message: string;
}

export default function Notifications() {
  const { userProfile } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const [messageForm, setMessageForm] = useState({
    type: 'general' as MessageType,
    message: '',
    includePaymentLink: false,
  });

  // FIXED: Wrapped fetchData in useCallback to fix dependency issue
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const tenantsData = await tenantService.getTenants(userProfile?.communityId || '');
      setTenants(tenantsData.filter(t => t.isActive));

      // Mock notification history
      const mockHistory: NotificationHistory[] = [
        {
          id: '1',
          type: 'maintenance_reminder',
          recipients: 25,
          sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          status: 'sent',
          message: 'Monthly maintenance reminder for March 2024'
        },
        {
          id: '2',
          type: 'general',
          recipients: 30,
          sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          status: 'sent',
          message: 'Community meeting announcement'
        },
        {
          id: '3',
          type: 'payment_confirmation',
          recipients: 15,
          sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          status: 'sent',
          message: 'Payment confirmation messages'
        },
      ];
      setNotificationHistory(mockHistory);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.communityId]);

  // FIXED: Added fetchData to dependencies
  useEffect(() => {
    if (userProfile?.communityId) {
      fetchData();
    }
  }, [userProfile?.communityId, fetchData]);

  const handleSelectAll = () => {
    if (selectedTenants.length === tenants.length) {
      setSelectedTenants([]);
    } else {
      setSelectedTenants(tenants.map(t => t.id));
    }
  };

  const handleTenantSelect = (tenantId: string) => {
    setSelectedTenants(prev => 
      prev.includes(tenantId) 
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  const handleSendMessage = async () => {
    if (selectedTenants.length === 0 || !messageForm.message.trim()) {
      alert('Please select tenants and enter a message');
      return;
    }

    try {
      setSending(true);
      
      // Send messages to selected tenants
      const selectedTenantData = tenants.filter(t => selectedTenants.includes(t.id));
      
      for (const tenant of selectedTenantData) {
        // Here you would integrate with your WhatsApp service
        console.log(`Sending message to ${tenant.name}: ${messageForm.message}`);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Add to history
      const newNotification: NotificationHistory = {
        id: Date.now().toString(),
        type: messageForm.type,
        recipients: selectedTenants.length,
        sentAt: new Date(),
        status: 'sent',
        message: messageForm.message
      };
      
      setNotificationHistory(prev => [newNotification, ...prev]);
      
      // Reset form
      setMessageForm({ type: 'general', message: '', includePaymentLink: false });
      setSelectedTenants([]);
      
      alert('Messages sent successfully!');
    } catch (error) {
      console.error('Error sending messages:', error);
      alert('Failed to send messages. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleSendMaintenanceReminders = async () => {
    try {
      setSending(true);
      
      // This would integrate with your maintenance service
      const result = await maintenanceNotificationService.sendBulkReminders(
        tenants,
        [], // maintenance records would be fetched here
        userProfile?.communityId || '',
        (tenantId, maintenanceId) => `https://pay.societypay.com/${tenantId}/${maintenanceId}`
      );
      
      alert(`Reminders sent! Success: ${result.success}, Failed: ${result.failed}`);
    } catch (error) {
      console.error('Error sending reminders:', error);
      alert('Failed to send reminders. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 ml-64">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 ml-64">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications & Messaging</h1>
        <p className="text-gray-600">Send WhatsApp messages and maintenance reminders to tenants</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message Composer */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Compose Message</h3>
              <button
                onClick={handleSendMaintenanceReminders}
                disabled={sending}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Maintenance Reminders
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Type
                </label>
                <select
                  value={messageForm.type}
                  onChange={(e) => setMessageForm({ ...messageForm, type: e.target.value as MessageType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-transparent"
                >
                  <option value="general">General Message</option>
                  <option value="maintenance_reminder">Maintenance Reminder</option>
                  <option value="payment_confirmation">Payment Confirmation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Content
                </label>
                <textarea
                  value={messageForm.message}
                  onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-transparent"
                  placeholder="Enter your message here..."
                />
              </div>

              {messageForm.type === 'maintenance_reminder' && (
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={messageForm.includePaymentLink}
                      onChange={(e) => setMessageForm({ ...messageForm, includePaymentLink: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Include Payment Link</span>
                  </label>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {selectedTenants.length} tenant(s) selected
                </span>
                <button
                  onClick={handleSendMessage}
                  disabled={sending || selectedTenants.length === 0 || !messageForm.message.trim()}
                  className="bg-secondary text-white px-6 py-2 rounded-md hover:bg-secondary/90 disabled:opacity-50 flex items-center"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>

          {/* Notification History */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Notification History</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {notificationHistory.map((notification) => (
                <div key={notification.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-3 ${
                        notification.type === 'maintenance_reminder' ? 'bg-blue-100' :
                        notification.type === 'payment_confirmation' ? 'bg-green-100' :
                        'bg-gray-100'
                      }`}>
                        <MessageSquare className={`h-5 w-5 ${
                          notification.type === 'maintenance_reminder' ? 'text-blue-600' :
                          notification.type === 'payment_confirmation' ? 'text-green-600' :
                          'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{notification.message}</h4>
                        <p className="text-sm text-gray-500">
                          Sent to {notification.recipients} recipients • {notification.sentAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      notification.status === 'sent' 
                        ? 'bg-green-100 text-green-800' 
                        : notification.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {notification.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tenant Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Select Recipients</h3>
              <button
                onClick={handleSelectAll}
                className="text-secondary hover:text-secondary/80 text-sm font-medium"
              >
                {selectedTenants.length === tenants.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {tenants.map((tenant) => (
              <div key={tenant.id} className="p-4 border-b border-gray-100 last:border-b-0">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTenants.includes(tenant.id)}
                    onChange={() => handleTenantSelect(tenant.id)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                    <div className="text-sm text-gray-500">{tenant.flatNumber}</div>
                    <div className="text-xs text-gray-400">{tenant.phone}</div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
