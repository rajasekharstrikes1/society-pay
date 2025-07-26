import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, Users, DollarSign, Building2 } from 'lucide-react';
import { dashboardService } from '../../services/firebase';

export default function SuperAdminReports() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalCommunities: 0,
    activeCommunities: 0,
    totalTenants: 0,
    monthlyGrowth: 0,
    collectionRate: 0
  });

  // Mock data for charts - in real app, this would come from Firebase
  const monthlyRevenueData = [
    { month: 'Jan', revenue: 45000, communities: 12, tenants: 450 },
    { month: 'Feb', revenue: 52000, communities: 18, tenants: 520 },
    { month: 'Mar', revenue: 68000, communities: 25, tenants: 680 },
    { month: 'Apr', revenue: 75000, communities: 32, tenants: 750 },
    { month: 'May', revenue: 85000, communities: 38, tenants: 850 },
    { month: 'Jun', revenue: 95000, communities: 45, tenants: 950 },
  ];

  const subscriptionDistribution = [
    { name: 'Basic Plan', value: 60, color: '#0e2625' },
    { name: 'Premium Plan', value: 30, color: '#309b47' },
    { name: 'Enterprise Plan', value: 10, color: '#f59e0b' },
  ];

  const stateWiseData = [
    { state: 'Maharashtra', communities: 15, revenue: 35000 },
    { state: 'Karnataka', communities: 12, revenue: 28000 },
    { state: 'Tamil Nadu', communities: 8, revenue: 18000 },
    { state: 'Delhi', communities: 6, revenue: 15000 },
    { state: 'Gujarat', communities: 4, revenue: 9000 },
  ];

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const stats = await dashboardService.getSuperAdminStats();
      setReportData({
        totalRevenue: 95000,
        totalCommunities: stats.totalCommunities,
        activeCommunities: stats.activeCommunities,
        totalTenants: stats.totalTenants,
        monthlyGrowth: 15.5,
        collectionRate: stats.collectionRate
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const reportContent = [
      ['Metric', 'Value'],
      ['Total Revenue', `₹${reportData.totalRevenue.toLocaleString()}`],
      ['Total Communities', reportData.totalCommunities],
      ['Active Communities', reportData.activeCommunities],
      ['Total Tenants', reportData.totalTenants],
      ['Monthly Growth', `${reportData.monthlyGrowth}%`],
      ['Collection Rate', `${reportData.collectionRate}%`],
      [''],
      ['Monthly Revenue Data'],
      ['Month', 'Revenue', 'Communities', 'Tenants'],
      ...monthlyRevenueData.map(item => [item.month, item.revenue, item.communities, item.tenants])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([reportContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `super-admin-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
            <h1 className="text-2xl font-bold text-gray-900">Platform Reports</h1>
            <p className="text-gray-600">Comprehensive analytics and insights</p>
          </div>
          <div className="flex space-x-4">
            <div className="flex space-x-2">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-transparent"
              />
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-transparent"
              />
            </div>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{reportData.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-green-600">+{reportData.monthlyGrowth}% from last month</p>
            </div>
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Communities</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.activeCommunities}</p>
              <p className="text-sm text-gray-500">of {reportData.totalCommunities} total</p>
            </div>
            <Building2 className="h-8 w-8 text-secondary" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tenants</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.totalTenants.toLocaleString()}</p>
              <p className="text-sm text-green-600">+8% from last month</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Collection Rate</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.collectionRate}%</p>
              <p className="text-sm text-green-600">+2% from last month</p>
            </div>
            <TrendingUp className="h-8 w-8 text-secondary" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Revenue Trend */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#309b47" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subscription Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={subscriptionDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
              >
                {subscriptionDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-4 mt-4">
            {subscriptionDistribution.map((entry, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: entry.color }}></div>
                <span className="text-sm text-gray-600">{entry.name} ({entry.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Community Growth */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="communities" fill="#0e2625" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* State-wise Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">State-wise Distribution</h3>
          <div className="space-y-4">
            {stateWiseData.map((state, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{state.state}</div>
                  <div className="text-sm text-gray-500">{state.communities} communities</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">₹{state.revenue.toLocaleString()}</div>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-secondary h-2 rounded-full" 
                      style={{ width: `${(state.revenue / 35000) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
