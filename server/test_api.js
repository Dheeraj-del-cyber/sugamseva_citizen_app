const http = require('http');

const postData = JSON.stringify({
  name: 'Aarav Sharma',
  phone: '9876543210',
  password: 'password123',
  fingerprints: [
    { fingerIndex: 0, fingerName: 'Right Thumb', scanQuality: 98 },
    { fingerIndex: 1, fingerName: 'Right Index', scanQuality: 97 },
    { fingerIndex: 2, fingerName: 'Left Thumb', scanQuality: 96 },
    { fingerIndex: 3, fingerName: 'Left Index', scanQuality: 99 }
  ]
});

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', JSON.stringify(JSON.parse(data), null, 2));
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(postData);
req.end();
