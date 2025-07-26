import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Building2, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings, 
  UserCircle,
  Bell,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const superAdminNavItems = [
  { icon: Home, label: 'Dashboard', href: '/super-admin' },
  { icon: Building2, label: 'Communities', href: '/super-admin/communities' },
  { icon: DollarSign, label: 'Subscriptions', href: '/super-admin/subscriptions' },
  { icon: CreditCard, label: 'Payments', href: '/super-admin/payments' },
  { icon: BarChart3, label: 'Reports', href: '/super-admin/reports' },
  { icon: Settings, label: 'Settings', href: '/super-admin/settings' },
];

const communityAdminNavItems = [
  { icon: Home, label: 'Dashboard', href: '/admin' },
  { icon: Building2, label: 'Blocks & Flats', href: '/admin/blocks' },
  { icon: Users, label: 'Residents', href: '/admin/residents' },
  { icon: CreditCard, label: 'Maintenance', href: '/admin/maintenance' },
  { icon: Bell, label: 'Notifications', href: '/admin/notifications' },
  { icon: BarChart3, label: 'Reports', href: '/admin/reports' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

export default function Sidebar() {
  const { userProfile } = useAuth();
  
  const navItems = userProfile?.role === 'super_admin' ? superAdminNavItems : communityAdminNavItems;

  return (
    <div className="bg-primary h-screen w-64 fixed left-0 top-0 text-white flex flex-col">
      <div className="p-6 border-b border-primary-light">
        <h1 className="text-xl font-bold">SocietyPay</h1>
        <p className="text-sm text-gray-300 mt-1">Maintenance Management</p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-secondary text-white'
                      : 'text-gray-300 hover:bg-primary-light hover:text-white'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-primary-light">
        <div className="flex items-center space-x-3">
          <UserCircle className="h-8 w-8 text-gray-300" />
          <div>
            <p className="text-sm font-medium">{userProfile?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{userProfile?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}