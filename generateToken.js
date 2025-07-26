console.log('Step 1: Starting script...');

try {
  console.log('Step 2: Importing firebase-admin...');
  const admin = await import('firebase-admin');  // Changed to import

  console.log('Step 3: Initializing app with config...');
  admin.default.initializeApp({
    credential: admin.default.credential.cert('./serviceAccountKey.json')  // Path to your JSON file
  });

  console.log('Step 4: Setting UID...');
  const uid = 'GQ72qURYmrTs75J9qxqNzze4WDe2';  // Replace with real UID from Firebase Console

  console.log('Step 5: Creating custom token...');
  admin.default.auth().createCustomToken(uid)
    .then(token => {
      console.log('Success! Custom Token:', token);
    })
    .catch(error => {
      console.error('Error creating token:', error.message);
    });

  console.log('Step 6: Script finished running.');
} catch (error) {
  console.error('Script failed early:', error.message);
}
