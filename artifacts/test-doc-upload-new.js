const fs = require('fs');
const http = require('http');

const registerReq = http.request(
  { hostname: 'localhost', port: 5001, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
  res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      const parsed = JSON.parse(body);
      if (!parsed.token) {
         console.log('REGISTER FAILED', parsed);
         return;
      }
      console.log('REGISTER SUCCESS');
      const token = parsed.token;
      
      const boundary = 'TestBoundary123456789';
      const bodyPrefix = Buffer.from(
        '--' + boundary + '\r\n' +
        'Content-Disposition: form-data; name="document"; filename="test.pdf"\r\n' +
        'Content-Type: application/json\r\n\r\n'
      );
      const fakePdf = Buffer.alloc(500 * 1024, 'A');
      fakePdf.write('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\n%%EOF', 0);
      const bodySuffix = Buffer.from('\r\n--' + boundary + '--\r\n');
      const fullBody = Buffer.concat([bodyPrefix, fakePdf, bodySuffix]);

      const req = http.request(
        { 
          hostname: 'localhost', 
          port: 5000, 
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
            console.log('Upload Status:', res2.statusCode);
            console.log('Upload Response:', data2);
          });
        }
      );
      req.on('error', e => console.error('Upload Error:', e.message));
      req.write(fullBody);
      req.end();
    });
  }
);
registerReq.write(JSON.stringify({ 
  email: 'testteacher' + Date.now() + '@test.com', 
  password: 'password123',
  fullName: 'Test Teacher',
  role: 'teacher'
}));
registerReq.end();
