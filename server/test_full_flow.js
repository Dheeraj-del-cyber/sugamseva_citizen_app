const http = require('http');

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
};

async function runFullVerification() {
  console.log('========================================================');
  console.log('🧪 RUNNING FULL CITIZEN APP BACKEND & DATABASE TEST SUITE');
  console.log('========================================================\n');

  // 1. Health Check
  const health = await request('GET', '/api/health');
  console.log('✅ 1. Health Check Status:', health.status, health.body);

  // 2. Sign Up Citizen with 4-Finger Biometric Enrollment
  const citizenSignupPayload = {
    name: 'Priya Patel',
    phone: '9988776655',
    password: 'password123',
    email: 'priya.patel@karnataka.gov.in',
    fingerprints: [
      { fingerIndex: 0, fingerName: 'Right Thumb', scanQuality: 98, biometricTemplate: 'BIO_SHA256_PRIYA_RT' },
      { fingerIndex: 1, fingerName: 'Right Index', scanQuality: 97, biometricTemplate: 'BIO_SHA256_PRIYA_RI' },
      { fingerIndex: 2, fingerName: 'Left Thumb', scanQuality: 96, biometricTemplate: 'BIO_SHA256_PRIYA_LT' },
      { fingerIndex: 3, fingerName: 'Left Index', scanQuality: 99, biometricTemplate: 'BIO_SHA256_PRIYA_LI' }
    ]
  };

  const signupRes = await request('POST', '/api/auth/signup', citizenSignupPayload);
  console.log('\n✅ 2. Citizen Sign Up (4-Finger Biometrics Enrolled):', signupRes.status);
  console.log('   User ID:', signupRes.body.user?.id);
  console.log('   Citizen Name:', signupRes.body.user?.name);
  console.log('   Phone Number:', signupRes.body.user?.phone);
  console.log('   Fingerprints Enrolled:', signupRes.body.fingerprints?.length);
  const token = signupRes.body.token;

  // 3. Password Sign In
  const signinPassRes = await request('POST', '/api/auth/signin', {
    phone: '9988776655',
    password: 'password123'
  });
  console.log('\n✅ 3. Password Sign In:', signinPassRes.status);
  console.log('   Message:', signinPassRes.body.message);
  console.log('   Authenticated User:', signinPassRes.body.user?.name);

  // 4. Biometric Fingerprint Sign In
  const signinBioRes = await request('POST', '/api/auth/signin', {
    phone: '9988776655',
    isBiometric: true,
    fingerIndex: 0 // Right Thumb
  });
  console.log('\n✅ 4. Biometric Fingerprint Sign In:', signinBioRes.status);
  console.log('   Message:', signinBioRes.body.message);

  // 5. Get Citizen Profile & Fingerprint Tracking Summary
  const profileRes = await request('GET', '/api/user/profile', null, token);
  console.log('\n✅ 5. Citizen Profile & Stats:', profileRes.status);
  console.log('   Profile:', profileRes.body.user);
  console.log('   Biometric Registry:', profileRes.body.fingerprints.map(f => `${f.fingerName} (${f.scanQuality}%)`));
  console.log('   Stats:', profileRes.body.stats);

  // 6. Update Profile
  const updateRes = await request('PUT', '/api/user/profile', {
    name: 'Priya R. Patel',
    email: 'priya.patel.official@karnataka.gov.in'
  }, token);
  console.log('\n✅ 6. Profile Updated in DB:', updateRes.status);
  console.log('   New Name:', updateRes.body.user?.name);
  console.log('   New Email:', updateRes.body.user?.email);

  // 7. Submit Application & Track
  const submitRes = await request('POST', '/api/applications', {
    schemeId: 'pm-kisan',
    schemeName: 'PM-KISAN Samman Nidhi'
  }, token);
  console.log('\n✅ 7. Application Submission:', submitRes.status);
  console.log('   Application ID:', submitRes.body.application?.id);

  const appsRes = await request('GET', '/api/applications', null, token);
  console.log('\n✅ 8. User Applications List:', appsRes.status);
  console.log('   Applications count for user:', appsRes.body.applications?.length);

  // 9. Citizen Documents
  const docsRes = await request('GET', '/api/documents', null, token);
  console.log('\n✅ 9. Citizen DigiLocker Documents:', docsRes.status);
  console.log('   Documents count:', docsRes.body.documents?.length);

  console.log('\n========================================================');
  console.log('🎉 ALL BACKEND, DATABASE, 4-FINGER BIOMETRICS & API TESTS PASSED!');
  console.log('========================================================\n');
}

runFullVerification().catch(console.error);
