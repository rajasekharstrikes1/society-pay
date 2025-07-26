import React, { useState, useEffect, useCallback } from 'react';
import { Users, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import StatCard from '../../components/Dashboard/StatCard';
import { dashboardService, paymentService, tenantService } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Payment } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface DashboardStats {
  totalTenants: number;
  totalMonthlyMaintenance: number;
  totalPaid: number;
  totalDue: number;
  collectionRate: number;
}

interface RecentPayment extends Payment {
  tenantName?: string;
  flatNumber?: string;
}

export default function CommunityAdminDashboard() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalTenants: 0,
    totalMonthlyMaintenance: 0,
    totalPaid: 0,
    totalDue: 0,
    collectionRate: 0,
  });
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [loading, setLoading] = useState(true);

  // FIXED: Wrapped fetchDashboardData in useCallback to fix dependency issue
  const fetchDashboardData = useCallback(async () => {
    if (!userProfile?.communityId) return;

    try {
      setLoading(true);

      // Fetch real data from Firebase
      const [dashboardStats, payments, tenantsData] = await Promise.all([
        dashboardService.getCommunityAdminStats(userProfile.communityId),
        paymentService.getPayments(userProfile.communityId, 10),
        tenantService.getTenants(userProfile.communityId)
      ]);

      setStats(dashboardStats);

      // Enhance payments with tenant details
      const paymentsWithDetails = payments.map(payment => {
        const tenant = tenantsData.find(t => t.id === payment.tenantId);
        return {
          ...payment,
          tenantName: tenant?.name || 'Unknown',
          flatNumber: tenant?.flatNumber || 'N/A'
        };
      });

      setRecentPayments(paymentsWithDetails);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.communityId]);

  // FIXED: Added fetchDashboardData to dependencies
  useEffect(() => {
    if (userProfile?.communityId) {
      fetchDashboardData();
    }
  }, [userProfile?.communityId, fetchDashboardData]);

  const paymentStatusData = [
    { 
      name: 'Paid', 
      value: Math.round((stats.totalPaid / (stats.totalPaid + stats.totalDue)) * 100) || 0, 
      color: '#309b47' 
    },
    { 
      name: 'Pending', 
      value: Math.round((stats.totalDue / (stats.totalPaid + stats.totalDue)) * 100) || 0, 
      color: '#f59e0b' 
    },
  ];

  // Mock monthly collection data - in real app, this would come from maintenance records
  const monthlyCollectionData = [
    { month: 'Jan', collected: 85000, target: 90000 },
    { month: 'Feb', collected: 88000, target: 90000 },
    { month: 'Mar', collected: 92000, target: 90000 },
    { month: 'Apr', collected: 87000, target: 90000 },
    { month: 'May', collected: 95000, target: 90000 },
    { month: 'Jun', collected: stats.totalPaid, target: stats.totalMonthlyMaintenance },
  ];

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
        <h1 className="text-2xl font-bold text-gray-900">Community Dashboard</h1>
        <p className="text-gray-600">Monthly Overview - {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Tenants"
          value={stats.totalTenants.toString()}
          icon={Users}
          change="+3 new this month"
          changeType="positive"
        />
        <StatCard
          title="Monthly Maintenance"
          value={`₹${stats.totalMonthlyMaintenance.toLocaleString()}`}
          icon={DollarSign}
          change={`Target: ₹${stats.totalMonthlyMaintenance.toLocaleString()}`}
          changeType="neutral"
        />
        <StatCard
          title="Collected This Month"
          value={`₹${stats.totalPaid.toLocaleString()}`}
          icon={CheckCircle}
          change={`${stats.collectionRate.toFixed(1)}% collection rate`}
          changeType="positive"
        />
        <StatCard
          title="Pending Amount"
          value={`₹${stats.totalDue.toLocaleString()}`}
          icon={AlertCircle}
          change={`${Math.round(stats.totalDue / (stats.totalMonthlyMaintenance / stats.totalTenants || 1))} tenants pending`}
          changeType="negative"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Payment Status Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
              >
                {paymentStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-4 mt-4">
            {paymentStatusData.map((entry, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: entry.color }}></div>
                <span className="text-sm text-gray-600">{entry.name} ({entry.value}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Collection Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Collection vs Target</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyCollectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, '']} />
              <Bar dataKey="collected" fill="#309b47" />
              <Bar dataKey="target" fill="#0e2625" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Flat No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentPayments.length > 0 ? (
                recentPayments.map((payment, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.tenantName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.flatNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{payment.amount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        payment.status === 'success' 
                          ? 'bg-green-100 text-green-800' 
                          : payment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.createdAt.toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No recent payments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
