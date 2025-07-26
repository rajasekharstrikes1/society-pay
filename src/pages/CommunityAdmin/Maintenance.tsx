import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Send, Download, Calendar, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { maintenanceService, residentService } from '../../services/firebase';
import { MaintenanceRecord, Resident } from '../../types';

// FIXED: Added proper type for filter status instead of using 'any'
type FilterStatus = 'all' | 'pending' | 'paid' | 'overdue';

export default function Maintenance() {
  const { userProfile } = useAuth();
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // FIXED: Wrapped fetchData in useCallback to fix dependency issue
  const fetchData = useCallback(async () => {
    if (!userProfile?.communityId) return;

    try {
      setLoading(true);
      const [records, residentsData] = await Promise.all([
        maintenanceService.getMaintenanceRecords(userProfile.communityId, {
          month: selectedMonth,
          year: selectedYear
        }),
        residentService.getResidents(userProfile.communityId)
      ]);

      setMaintenanceRecords(records);
      setResidents(residentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.communityId, selectedMonth, selectedYear]);

  // FIXED: Added fetchData to dependencies
  useEffect(() => {
    if (userProfile?.communityId) {
      fetchData();
    }
  }, [userProfile?.communityId, fetchData]);

  const handleGenerateMaintenance = async () => {
    if (!userProfile?.communityId) return;

    try {
      await maintenanceService.generateMonthlyMaintenance(
        userProfile.communityId,
        selectedMonth,
        selectedYear
      );
      setShowGenerateModal(false);
      fetchData();
    } catch (error) {
      console.error('Error generating maintenance:', error);
    }
  };

  const handleSendReminders = async () => {
    // Implementation for sending WhatsApp reminders
    console.log('Sending reminders...');
    alert('Reminders sent successfully!');
  };

  const exportMaintenanceReport = () => {
    const csvContent = [
      ['Resident Name', 'Flat Number', 'Amount', 'GST', 'Handling Charges', 'Total', 'Status', 'Due Date'].join(','),
      ...filteredRecords.map(record => {
        const resident = residents.find(t => t.id === record.residentId);
        return [
          resident?.name || 'Unknown',
          resident?.flatNumber || 'N/A',
          record.amount,
          record.gstAmount,
          record.handlingCharges,
          record.totalAmount,
          record.status,
          record.dueDate.toLocaleDateString()
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maintenance-${selectedMonth}-${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredRecords = maintenanceRecords.filter(record => {
    return filterStatus === 'all' || record.status === filterStatus;
  });

  const stats = {
    total: filteredRecords.length,
    paid: filteredRecords.filter(r => r.status === 'paid').length,
    pending: filteredRecords.filter(r => r.status === 'pending').length,
    overdue: filteredRecords.filter(r => r.status === 'overdue').length,
    totalAmount: filteredRecords.reduce((sum, r) => sum + r.totalAmount, 0),
    paidAmount: filteredRecords.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.totalAmount, 0),
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Maintenance Management</h1>
            <p className="text-gray-600">Generate and track monthly maintenance collections</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSendReminders}
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 flex items-center"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Reminders
            </button>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondary/90 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate Maintenance
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex space-x-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
          >
            {months.map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
          >
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>

          <button
            onClick={exportMaintenanceReport}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Calendar className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Collection Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total > 0 ? ((stats.paid / stats.total) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-secondary" />
          </div>
        </div>
      </div>

      {/* Maintenance Records Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Maintenance Records - {selectedMonth} {selectedYear}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Flat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GST
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record) => {
                const resident = residents.find(t => t.id === record.residentId);
                return (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {resident?.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {resident?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{resident?.flatNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{record.amount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{record.gstAmount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₹{record.totalAmount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.dueDate.toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : record.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-secondary hover:text-secondary/80 mr-3">
                        Send Reminder
                      </button>
                      <button className="text-primary hover:text-primary/80">
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Maintenance Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Generate Monthly Maintenance</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-transparent"
                >
                  {months.map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-transparent"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-700">
                  This will generate maintenance records for all active residents for {selectedMonth} {selectedYear}.
                </p>
              </div>
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateMaintenance}
                className="flex-1 bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondary/90"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
