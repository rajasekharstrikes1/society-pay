import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';

// Environment validation
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN', 
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing Firebase environment variables:', missingVars);
  console.error('Please check your .env file and ensure all Firebase configuration variables are set.');
  throw new Error(`Missing required Firebase configuration: ${missingVars.join(', ')}`);
}

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Enhanced validation
const validateConfig = (config: typeof firebaseConfig) => {
  const invalidKeys = Object.entries(config).filter(([key, value]) => 
    !value || 
    value === 'your_actual_api_key_here' || 
    value === 'undefined' ||
    value === 'null'
  );

  if (invalidKeys.length > 0) {
    console.error('❌ Invalid Firebase configuration values:', invalidKeys.map(([key]) => key));
    throw new Error('Firebase configuration contains invalid values. Please check your .env file.');
  }

  // Validate project ID format
  const projectIdRegex = /^[a-z0-9-]+$/;
  if (!projectIdRegex.test(config.projectId)) {
    throw new Error('Invalid Firebase project ID format');
  }

  console.log('✅ Firebase configuration validated successfully');
  console.log('🔗 Project ID:', config.projectId);
  console.log('🌍 Auth Domain:', config.authDomain);
};

// Validate configuration
validateConfig(firebaseConfig);

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let functions: Functions;

try {
  app = initializeApp(firebaseConfig);
  console.log('🚀 Firebase app initialized successfully');

  // Initialize services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  // Initialize Functions with region (adjust region as needed)
  const functionsRegion = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1';
  functions = getFunctions(app, functionsRegion);
  
  console.log('🔧 Firebase services initialized');
  console.log('📍 Functions region:', functionsRegion);

} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error);
  throw error;
}

// Development environment setup
const isDevelopment = import.meta.env.DEV;
const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

if (isDevelopment && useEmulator) {
  console.log('🔧 Development mode: Connecting to Firebase Emulators');
  
  try {
    // Connect to emulators (only in development)
    const emulatorConfig = {
      auth: { host: 'localhost', port: 9099 },
      firestore: { host: 'localhost', port: 8080 },
      functions: { host: 'localhost', port: 5001 },
      storage: { host: 'localhost', port: 9199 }
    };

    // Connect Auth Emulator
    if (!auth._delegate._authProvider) {
      connectAuthEmulator(auth, `http://${emulatorConfig.auth.host}:${emulatorConfig.auth.port}`, {
        disableWarnings: true
      });
      console.log('🔗 Connected to Auth Emulator');
    }

    // Connect Firestore Emulator
    if (!db._delegate._databaseId.projectId.includes('emulator')) {
      connectFirestoreEmulator(db, emulatorConfig.firestore.host, emulatorConfig.firestore.port);
      console.log('🔗 Connected to Firestore Emulator');
    }

    // Connect Functions Emulator
    connectFunctionsEmulator(functions, emulatorConfig.functions.host, emulatorConfig.functions.port);
    console.log('🔗 Connected to Functions Emulator');

    // Connect Storage Emulator
    connectStorageEmulator(storage, emulatorConfig.storage.host, emulatorConfig.storage.port);
    console.log('🔗 Connected to Storage Emulator');

  } catch (emulatorError) {
    console.warn('⚠️ Some emulators may not be available:', emulatorError);
  }
}

// Export initialized services
export { auth, db, storage, functions };
export default app;

// Additional utility exports
export const isEmulatorMode = isDevelopment && useEmulator;
export const projectId = firebaseConfig.projectId;

// Helper function to check if Firebase is properly configured
export const isFirebaseConfigured = (): boolean => {
  try {
    return !!(app && auth && db && storage && functions);
  } catch {
    return false;
  }
};

// Function to get current user auth token (useful for API calls)
export const getCurrentUserToken = async (): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  } catch (error) {
    console.error('Failed to get user token:', error);
    return null;
  }
};

// API helper function for calling your Firebase Functions
export const callAPI = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const baseURL = isDevelopment && useEmulator 
    ? 'http://localhost:5001/tenant-f74c7/us-central1/api'  // Emulator URL
    : '/api';  // Production URL (via Firebase Hosting rewrites)

  const token = await getCurrentUserToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseURL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API call failed: ${response.status}`);
  }

  return response;
};

// Payment API helpers (specific to your Razorpay integration)
export const createRazorpayOrder = async (amount: number, currency = 'INR'): Promise<any> => {
  try {
    const response = await callAPI('/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount: amount * 100, currency }) // Convert to paise
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to create Razorpay order:', error);
    throw error;
  }
};

export const verifyPayment = async (paymentData: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<any> => {
  try {
    const response = await callAPI('/verify-payment', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to verify payment:', error);
    throw error;
  }
};

export const getOrderStatus = async (orderId: string): Promise<any> => {
  try {
    const response = await callAPI(`/order/${orderId}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to get order status:', error);
    throw error;
  }
};
