const http = require('http');

const testSignIn = (body, desc) => {
  const postData = JSON.stringify(body);
  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/signin',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      console.log(`\n--- Test: ${desc} ---`);
      console.log('Status Code:', res.statusCode);
      console.log('Response:', JSON.stringify(JSON.parse(data), null, 2));
    });
  });

  req.write(postData);
  req.end();
};

// 1. Password sign in
testSignIn({ phone: '9876543210', password: 'password123' }, 'Password Sign In');

// 2. Biometric sign in
setTimeout(() => {
  testSignIn({ phone: '9876543210', isBiometric: true, fingerIndex: 0 }, 'Biometric Sign In');
}, 500);
