const request = require('supertest');
const app = require('../server');

describe('Auth Middleware', () => {
  it('should allow access with a valid token', async () => {
    const token = 'valid-jwt-token';  // Replace this with a real JWT token
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('should deny access with an invalid token', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.status).toBe(401);
  });
});
