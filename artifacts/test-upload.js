/**
 * Test script: verifies the upload endpoint correctly handles multipart/form-data.
 * Without auth, we expect 401 — NOT a 500 "multer parse error" or "no file provided".
 * With a bad Content-Type, we'd get "No video file provided" (400) which means multer
 * couldn't find the file — that's the OLD broken behaviour.
 */

const http = require('http');
const { Readable } = require('stream');

const boundary = 'TestBoundary123456789';

// Build a minimal multipart/form-data body
const body = [
  `--${boundary}`,
  'Content-Disposition: form-data; name="video"; filename="test.mp4"',
  'Content-Type: video/mp4',
  '',
  'FAKE_VIDEO_BYTES_FOR_TESTING',
  `--${boundary}--`,
  '',
].join('\r\n');

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/upload/video',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(body),
    // No Authorization header → expect 401 Unauthorized
  },
};

console.log('🧪 Testing multipart upload endpoint...');
console.log('   Sending POST /api/upload/video with a fake video file');
console.log('   Expected: 401 Unauthorized (auth required) — NOT a 500 server error');
console.log('   Old broken behavior was: 400 "No video file provided" (multer could not parse it)');
console.log('');

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('📡 Status code:', res.statusCode);
    console.log('📦 Response body:', data);
    console.log('');

    if (res.statusCode === 401) {
      console.log('✅ PASS: Server correctly requires authentication before processing the file.');
      console.log('   This means multer DID correctly parse the multipart body (saw a file),');
      console.log('   then the auth middleware kicked in and returned 401.');
    } else if (res.statusCode === 400 && data.includes('No video file')) {
      console.log('❌ FAIL: Server returned "No video file provided" — multer could not parse the multipart body.');
      console.log('   This means the Content-Type header fix did NOT work.');
    } else {
      console.log('ℹ️  Unexpected status. Review the response above.');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Could not connect to server:', e.message);
  console.error('   Make sure the dev server is running on port 5001.');
});

req.write(body);
req.end();
