const request = require('supertest');
const app = require('../server');  
const User = require('../models/user.model');  

describe('User Routes', () => {
  let token;

  // Test for user registration
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        username: 'testuser',
        password: 'password123',
        email: 'testuser@example.com'
      });

    expect(res.status).toBe(201);
    expect(res.body.username).toBe('testuser');
  });

  // Test for login and generating token
  it('should login and return a JWT token', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        username: 'testuser',
        password: 'password123'
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  // Test for getting user profile (with valid token)
  it('should return user profile with valid token', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.username).toBe('testuser');
  });

  // Test for getting user profile (with invalid token)
  it('should return 401 for invalid token', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.status).toBe(401);
  });
});
