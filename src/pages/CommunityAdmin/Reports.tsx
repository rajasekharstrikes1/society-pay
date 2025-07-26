import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Send, Download, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Reports() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    totalPaid: 0,
    totalDue: 0,
    totalAmount: 0,
    collectionRate: 0,
    recordsCount: 0,
  });

  const [monthlyData, setMonthlyData] = useState([
    { month: 'Jan', collected: 85000, target: 90000 },
    { month: 'Feb', collected: 88000, target: 90000 },
    { month: 'Mar', collected: 92000, target: 90000 },
    { month: 'Apr', collected: 87000, target: 90000 },
    { month: 'May', collected: 95000, target: 90000 },
    { month: 'Jun', collected: 89000, target: 90000 },
  ]);

  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // FIXED: Wrapped fetchReportData in useCallback to fix dependency issue
  const fetchReportData = useCallback(async () => {
    if (!userProfile?.communityId) return;

    try {
      setLoading(true);
      
      // Mock data - replace with actual service calls
      const mockStats = {
        totalPaid: 450000,
        totalDue: 85000,
        totalAmount: 535000,
        collectionRate: 84.1,
        recordsCount: 45,
      };

      setReportData(mockStats);

      // Update monthly data with current month data
      setMonthlyData(prev => prev.map(item => 
        item.month === selectedMonth.slice(0, 3) 
          ? { ...item, collected: mockStats.totalPaid / 6, target: mockStats.totalAmount / 6 }
          : item
      ));

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.communityId, selectedMonth]);

  // FIXED: Added fetchReportData to dependencies
  useEffect(() => {
    if (userProfile?.communityId) {
      fetchReportData();
    }
  }, [userProfile?.communityId, fetchReportData]);

  const exportReport = () => {
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Paid', `₹${reportData.totalPaid.toLocaleString()}`],
      ['Total Due', `₹${reportData.totalDue.toLocaleString()}`],
      ['Total Amount', `₹${reportData.totalAmount.toLocaleString()}`],
      ['Collection Rate', `${reportData.collectionRate}%`],
      ['Records Count', reportData.recordsCount],
      [''],
      ['Monthly Data'],
      ['Month', 'Collected', 'Target'],
      ...monthlyData.map(item => [item.month, item.collected, item.target])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `community-report-${selectedMonth}-${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateReport = () => {
    fetchReportData();
    alert(`Report generated for ${selectedMonth} ${selectedYear}`);
  };

  const sendReport = () => {
    alert('Report sent to community admin email');
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
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">Generate and view community maintenance reports</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={sendReport}
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 flex items-center"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Report
            </button>
            <button
              onClick={exportReport}
              className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondary/90 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Report Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
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

          <button
            onClick={generateReport}
            className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondary/90 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Collected</p>
              <p className="text-2xl font-bold text-green-600">₹{reportData.totalPaid.toLocaleString()}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Amount</p>
              <p className="text-2xl font-bold text-yellow-600">₹{reportData.totalDue.toLocaleString()}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{reportData.totalAmount.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Collection Rate</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.collectionRate}%</p>
            </div>
            <DollarSign className="h-8 w-8 text-secondary" />
          </div>
        </div>
      </div>

      {/* Monthly Collection Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Collection Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collected Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collection Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyData.map((month, index) => {
                const rate = ((month.collected / month.target) * 100).toFixed(1);
                return (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{month.month}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{month.target.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{month.collected.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{rate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        parseFloat(rate) >= 90 
                          ? 'bg-green-100 text-green-800' 
                          : parseFloat(rate) >= 75
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {parseFloat(rate) >= 90 ? 'Excellent' : parseFloat(rate) >= 75 ? 'Good' : 'Poor'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Summary for {selectedMonth} {selectedYear}</h3>
        <div className="prose prose-sm max-w-none">
          <ul className="space-y-2">
            <li>
              <strong>Total Records:</strong> {reportData.recordsCount} maintenance records processed
            </li>
            <li>
              <strong>Collection Performance:</strong> {reportData.collectionRate}% collection rate achieved
            </li>
            <li>
              <strong>Outstanding Amount:</strong> ₹{reportData.totalDue.toLocaleString()} pending collection
            </li>
            <li>
              <strong>Recommendation:</strong> {reportData.collectionRate >= 85 
                ? 'Excellent collection performance. Continue current practices.' 
                : 'Consider sending additional reminders for pending payments.'}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
