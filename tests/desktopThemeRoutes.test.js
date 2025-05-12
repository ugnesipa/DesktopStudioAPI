const request = require('supertest');
const app = require('../server');
const DesktopTheme = require('../models/desktopTheme.model');

describe('Desktop Theme Routes', () => {
  let token;
  let themeId;

  // Test creating a desktop theme
  it('should create a new desktop theme', async () => {
    const res = await request(app)
      .post('/api/desktop-themes/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Desktop Theme',
        description: 'A desktop theme for testing',
        category: 'Nature',
        wallpaper: 'someWallpaperId'
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test Desktop Theme');
    themeId = res.body._id;
  });

  // Test viewing a desktop theme by ID
  it('should view a specific desktop theme', async () => {
    const res = await request(app).get(`/api/desktop-themes/${themeId}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Test Desktop Theme');
  });

  // Test deleting a desktop theme
  it('should delete a desktop theme', async () => {
    const res = await request(app)
      .delete(`/api/desktop-themes/${themeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Desktop theme deleted successfully');
  });
});
