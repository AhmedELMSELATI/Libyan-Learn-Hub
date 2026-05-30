const fs = require('fs');
const http = require('http');

const loginReq = http.request(
  { hostname: 'localhost', port: 5001, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
  res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      const parsed = JSON.parse(body);
      if (!parsed.token) {
         console.log("LOGIN FAILED", parsed);
         return;
      }
      const token = parsed.token;
      
      const boundary = 'TestBoundary123456789';
      const bodyPrefix = Buffer.from(
        '--' + boundary + '\r\n' +
        'Content-Disposition: form-data; name="document"; filename="test.pdf"\r\n' +
        'Content-Type: application/pdf\r\n\r\n'
      );
      const fakePdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\n%%EOF');
      const bodySuffix = Buffer.from('\r\n--' + boundary + '--\r\n');
      const fullBody = Buffer.concat([bodyPrefix, fakePdf, bodySuffix]);

      const req = http.request(
        { 
          hostname: 'localhost', 
          port: 5001, 
          path: '/api/upload/document', 
          method: 'POST', 
          headers: { 
            'Content-Type': 'multipart/form-data; boundary=' + boundary,
            'Content-Length': fullBody.length,
            'Authorization': 'Bearer ' + token
          } 
        },
        res2 => {
          let data2 = '';
          res2.on('data', d => data2 += d);
          res2.on('end', () => {
            console.log('Status:', res2.statusCode);
            console.log('Response:', data2);
          });
        }
      );
      req.on('error', e => console.error('Upload Error:', e.message));
      req.write(fullBody);
      req.end();
    });
  }
);
// Use the admin seeded user
loginReq.write(JSON.stringify({ email: 'admin@hub.ly', password: 'admin123' }));
loginReq.end();
