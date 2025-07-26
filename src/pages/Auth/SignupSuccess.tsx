import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, CreditCard, Mail, Building2 } from 'lucide-react';

interface LocationState {
  adminEmail?: string;
}

export default function SignupSuccess() {
  const location = useLocation();
  const state = location.state as LocationState;
  const adminEmail = state?.adminEmail || '[your email]';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Registration Successful!
          </h2>
          <p className="mt-2 text-sm text-gray-200">
            Your community has been registered successfully
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">What's Next?</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Mail className="h-6 w-6 text-secondary" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Check Your Email</h4>
                <p className="text-sm text-gray-600">
                  We've sent a verification email to <strong>{adminEmail}</strong>. Please verify your email address.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CreditCard className="h-6 w-6 text-secondary" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Complete Payment</h4>
                <p className="text-sm text-gray-600">
                  Your account will be activated after payment verification. Our team will contact you shortly.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Building2 className="h-6 w-6 text-secondary" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Setup Your Community</h4>
                <p className="text-sm text-gray-600">
                  Once activated, you can start adding blocks, flats, and tenants to your community.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Need Help?</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Contact our support team at{' '}
                    <a href="mailto:support@societypay.com" className="font-medium underline">
                      support@societypay.com
                    </a>{' '}
                    or call us at{' '}
                    <a href="tel:+919876543210" className="font-medium underline">
                      +91 98765 43210
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              to="/login"
              className="w-full bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondary/90 flex items-center justify-center font-medium"
            >
              Go to Login
            </Link>
            <Link
              to="/signup"
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center justify-center font-medium"
            >
              Register Another Community
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
