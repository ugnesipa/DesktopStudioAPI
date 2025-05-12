const request = require('supertest');
const app = require('../server');
const Wallpaper = require('../models/wallpaper.model');

describe('Wallpaper Routes', () => {
  let token;

  // Test creating a wallpaper
  it('should create a new wallpaper', async () => {
    const res = await request(app)
      .post('/api/wallpapers/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Wallpaper',
        description: 'A beautiful wallpaper for testing',
        category: 'Nature',
        imageFile: 'somefile.jpg'
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test Wallpaper');
  });

  // Test viewing a wallpaper by ID
  it('should view a specific wallpaper', async () => {
    const wallpaper = await Wallpaper.create({
      title: 'Test Wallpaper',
      description: 'A beautiful wallpaper for testing',
      category: 'Nature',
      createdBy: 'someUserId'
    });

    const res = await request(app).get(`/api/wallpapers/${wallpaper._id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Test Wallpaper');
  });

  // Test deleting a wallpaper
  it('should delete a wallpaper', async () => {
    const wallpaper = await Wallpaper.create({
      title: 'Wallpaper to be deleted',
      description: 'This wallpaper will be deleted',
      category: 'Nature',
      createdBy: 'someUserId'
    });

    const res = await request(app)
      .delete(`/api/wallpapers/${wallpaper._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Wallpaper deleted successfully');
  });
});
