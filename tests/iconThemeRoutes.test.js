const request = require('supertest');
const app = require('../server');
const IconTheme = require('../models/iconTheme.model');

describe('Icon Theme Routes', () => {
  let token;
  let themeId;

  // Test creating an icon theme
  it('should create a new icon theme', async () => {
    const res = await request(app)
      .post('/api/icon-themes/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Icon Theme',
        description: 'An icon theme for testing',
        category: 'Nature',
        icons: ['someIconId']
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test Icon Theme');
    themeId = res.body._id;
  });

  // Test viewing an icon theme by ID
  it('should view a specific icon theme', async () => {
    const res = await request(app).get(`/api/icon-themes/${themeId}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Test Icon Theme');
  });

  // Test deleting an icon theme
  it('should delete an icon theme', async () => {
    const res = await request(app)
      .delete(`/api/icon-themes/${themeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Icon theme deleted successfully');
  });
});
