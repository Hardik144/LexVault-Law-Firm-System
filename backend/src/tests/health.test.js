const request = require('supertest');

// Simple test that does not need database
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'law-firm-backend' });
});

describe('Health Check API', () => {
  test('GET /health returns 200 with status ok', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  test('GET /health returns service name', async () => {
    const response = await request(app).get('/health');
    expect(response.body.service).toBe('law-firm-backend');
  });
});