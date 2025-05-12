const request = require('supertest');
const app = require('../server');
const Report = require('../models/report.model');

describe('Report Routes', () => {
  let token;

  // Test creating a report
  it('should create a new report', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        targetType: 'Wallpaper',
        targetId: 'someWallpaperId',
        reason: 'Inappropriate content',
        text: 'This wallpaper is offensive'
      });

    expect(res.status).toBe(201);
    expect(res.body.reason).toBe('Inappropriate content');
  });

  // Test viewing all reports
  it('should return all reports', async () => {
    const res = await request(app).get('/api/reports');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Test deleting a report
  it('should delete a report', async () => {
    const report = await Report.create({
      targetType: 'Wallpaper',
      targetId: 'someWallpaperId',
      reason: 'Inappropriate content',
      text: 'This wallpaper is offensive'
    });

    const res = await request(app)
      .delete(`/api/reports/${report._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Report deleted successfully');
  });
});
