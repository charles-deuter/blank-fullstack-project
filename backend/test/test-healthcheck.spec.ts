import request from 'supertest';
import app from '../src/app';

describe('GET /health-check', () => {
  it('should return 200 OK and status UP', async () => {
    const response = await request(app).get('/health-check');

    // Assertions
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toEqual({
      server_status: 'ACTIVE',
      connection_status: 'ACTIVE',
    });
  });
});
