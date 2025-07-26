import React, { useState, useEffect } from 'react';
import { Building2, Users, DollarSign, TrendingUp, Plus, Search } from 'lucide-react';
import StatCard from '../../components/Dashboard/StatCard';
import { communityService, dashboardService, userService, subscriptionPaymentService } from '../../services/firebase';
import { Community, SubscriptionPayment } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface DashboardStats {
  totalCommunities: number;
  activeCommunities: number;
  totalTenants: number;
  monthlyRevenue: number;
  collectionRate: number;
}

interface CommunityWithAdmin extends Community {
  adminName?: string;
  subscriptionName?: string;
  subscriptionStatus?: 'active' | 'expired' | 'none';
}

// FIXED: Added proper type for filter status instead of using 'any'
type FilterStatus = 'all' | 'active' | 'expired' | 'inactive';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCommunities: 0,
    activeCommunities: 0,
    totalTenants: 0,
    monthlyRevenue: 0,
    collectionRate: 0,
  });
  const [communities, setCommunities] = useState<CommunityWithAdmin[]>([]);
  const [recentPayments, setRecentPayments] = useState<SubscriptionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard stats
      const dashboardStats = await dashboardService.getSuperAdminStats();
      setStats(dashboardStats);

      // Fetch communities with admin details
      const communitiesData = await communityService.getCommunities();
      const users = await userService.getUsers();
      
      const communitiesWithAdmins = communitiesData.map(community => {
        const admin = users.find(user => user.id === community.adminId || user.email === community.adminId);
        const now = new Date();
        const subscriptionStatus = 
          !community.subscriptionEndDate ? 'none' :
          new Date(community.subscriptionEndDate) > now ? 'active' : 'expired';
        
        return {
          ...community,
          adminName: admin?.name || 'N/A',
          subscriptionName: 'Basic Plan', // This would come from subscription service
          subscriptionStatus
        };
      });

      setCommunities(communitiesWithAdmins);

      // Fetch recent subscription payments
      const allPayments: SubscriptionPayment[] = [];
      for (const community of communitiesData.slice(0, 5)) {
        try {
          const payments = await subscriptionPaymentService.getSubscriptionPayments(community.id);
          allPayments.push(...payments);
        } catch (error) {
          console.error(`Error fetching payments for community ${community.id}:`, error);
        }
      }
      
      allPayments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setRecentPayments(allPayments.slice(0, 10));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCommunityStatus = async (communityId: string) => {
    try {
      await communityService.toggleCommunityStatus(communityId);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error updating community status:', error);
    }
  };

  const filteredCommunities = communities.filter(community => {
    const matchesSearch = community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         community.adminName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && community.subscriptionStatus === 'active') ||
                         (filterStatus === 'expired' && community.subscriptionStatus === 'expired') ||
                         (filterStatus === 'inactive' && !community.isActive);

    return matchesSearch && matchesFilter;
  });

  // Mock chart data - in real app, this would come from analytics
  const monthlyData = [
    { month: 'Jan', communities: 12, revenue: 45000 },
    { month: 'Feb', communities: 18, revenue: 52000 },
    { month: 'Mar', communities: 25, revenue: 68000 },
    { month: 'Apr', communities: 32, revenue: 75000 },
    { month: 'May', communities: 38, revenue: 85000 },
    { month: 'Jun', communities: stats.totalCommunities, revenue: stats.monthlyRevenue },
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
        <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="text-gray-600">Overview of all communities and platform performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Communities"
          value={stats.totalCommunities.toString()}
          icon={Building2}
          change={`${stats.activeCommunities} active`}
          changeType="positive"
        />
        <StatCard
          title="Active Tenants"
          value={stats.totalTenants.toLocaleString()}
          icon={Users}
          change="+8% from last month"
          changeType="positive"
        />
        <StatCard
          title="Monthly Revenue"
          value={`₹${stats.monthlyRevenue.toLocaleString()}`}
          icon={DollarSign}
          change="+15% from last month"
          changeType="positive"
        />
        <StatCard
          title="Collection Rate"
          value={`${stats.collectionRate}%`}
          icon={TrendingUp}
          change="+2% from last month"
          changeType="positive"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#309b47" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Community Growth */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="communities" stroke="#0e2625" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Subscription Payments */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Subscription Payments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Community
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valid Until
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentPayments.map((payment) => {
                const community = communities.find(c => c.id === payment.communityId);
                return (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.createdAt.toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {community?.name || 'Unknown'}
                      </div>
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
                        {payment.endDate.toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Communities Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Communities Management</h3>
            <button className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondary/90 flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Add Community
            </button>
          </div>
          
          {/* Search and Filter */}
          <div className="mt-4 flex space-x-4">
            <div className="flex-1 relative">
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search communities or admins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active Subscription</option>
              <option value="expired">Expired Subscription</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Community Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
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
              {filteredCommunities.slice(0, 10).map((community) => (
                <tr key={community.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{community.name}</div>
                    <div className="text-sm text-gray-500">
                      Created: {community.createdAt.toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{community.adminName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{community.totalTenants}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{community.subscriptionName}</div>
                    <div className="text-sm text-gray-500">
                      {community.subscriptionEndDate ? 
                        `Until ${community.subscriptionEndDate.toLocaleDateString()}` : 
                        'No subscription'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      community.subscriptionStatus === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : community.subscriptionStatus === 'expired'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {community.subscriptionStatus === 'active' ? 'Active' : 
                       community.subscriptionStatus === 'expired' ? 'Expired' : 'No Subscription'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button 
                      onClick={() => toggleCommunityStatus(community.id)}
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        community.isActive 
                          ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {community.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button className="text-secondary hover:text-secondary/80">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
