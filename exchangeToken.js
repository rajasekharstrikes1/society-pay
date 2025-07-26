console.log('Starting exchange...');

async function exchange() {
  try {
    const { default: fetch } = await import('node-fetch');

    const customToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJodHRwczovL2lkZW50aXR5dG9vbGtpdC5nb29nbGVhcGlzLmNvbS9nb29nbGUuaWRlbnRpdHkuaWRlbnRpdHl0b29sa2l0LnYxLklkZW50aXR5VG9vbGtpdCIsImlhdCI6MTc1Mjg1NjUzNSwiZXhwIjoxNzUyODYwMTM1LCJpc3MiOiJmaXJlYmFzZS1hZG1pbnNkay1mYnN2Y0B0ZW5hbnQtZjc0YzcuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLCJzdWIiOiJmaXJlYmFzZS1hZG1pbnNkay1mYnN2Y0B0ZW5hbnQtZjc0YzcuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLCJ1aWQiOiJWeWVDdTRHdnZDYkpqQUp0VlYwdFhoOWplaXYyIn0.geZMJnLlLEDhORQH0JTHnV_ihtIhr9Im-fYmIMGJi03YHdt1HKEWo5qacenyHRbIuRIWagqyc2C7L5b9ZqQkvqsK9AeAu5W33_pZICLFrkyMeIMS_43P-7Qt9lgv6uRORwBX3w-MSA2C0bF0Wpuy2REkUuVR1aAuXRPVu-W7_U64s33TuRbhRF5jBRSwWDqn1h4KKWROZp1bwUnlyQxNBSCuLYXDJAv2ZM8jXTZ9RRdUFxpMjKcrZKs-0iShvD391MOagk2qIDluq7kEdQ0jsOk1qM9tUY92Xo1pslOXLqfq5vmv5BybGh-LUj8W_r-OpzhwapkhIhNlvTxWixhoNQ';  // Your generated custom token
    const apiKey = 'AIzaSyAqkGp0shvHAaZ5bEl-1C56rqL00FYRdu0';  // From Firebase Console

    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
      method: 'POST',
      body: JSON.stringify({
        token: customToken,
        returnSecureToken: true
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    if (data.idToken) {
      console.log('Success! ID Token:', data.idToken);
    } else {
      console.error('Error from API:', data.error);
    }
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
}

exchange();
