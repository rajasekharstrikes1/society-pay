import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Unauthorized() {
  const { signOut, userProfile } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-200">
            You don't have permission to access this page
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-xl p-8 space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Unauthorized Access
            </h3>
            <p className="text-gray-600 mb-4">
              Your current role ({userProfile?.role?.replace('_', ' ')}) doesn't have access to the requested page.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              to={userProfile?.role === 'super_admin' ? '/super-admin' : '/admin'}
              className="w-full bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondary/90 flex items-center justify-center"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Link>
            
            <button
              onClick={handleLogout}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center justify-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              If you believe this is an error, please contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
