const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../src/app');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      http.get({ hostname: '127.0.0.1', port, path }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          server.close(() => resolve({ statusCode: res.statusCode, body: data }));
        });
      }).on('error', (err) => {
        server.close(() => reject(err));
      });
    });
  });
}

test('GET /api/auth/register should not return 404', async () => {
  const response = await makeRequest('/api/auth/register');
  assert.notStrictEqual(response.statusCode, 404);
});

test('GET /api/auth/login should not return 404', async () => {
  const response = await makeRequest('/api/auth/login');
  assert.notStrictEqual(response.statusCode, 404);
});
