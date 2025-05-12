const request = require('supertest');
const app = require('../server');
const Icon = require('../models/icon.model');

describe('Icon Routes', () => {
  let token;
  let iconId;

  // Test creating an icon
  it('should create a new icon', async () => {
    const res = await request(app)
      .post('/api/icons/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Icon',
        description: 'An icon for testing',
        category: 'Nature',
        imageFile: 'iconfile.jpg'
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test Icon');
    iconId = res.body._id;
  });

  // Test viewing an icon by ID
  it('should view a specific icon', async () => {
    const res = await request(app).get(`/api/icons/${iconId}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Test Icon');
  });

  // Test deleting an icon
  it('should delete an icon', async () => {
    const res = await request(app)
      .delete(`/api/icons/${iconId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Icon deleted successfully');
  });
});
