import request from 'supertest';
import app from '../src/app';

describe('POST /api/foo', () => {
  it('should return 201 and the created record', async () => {
    const response = await request(app).post('/api/foo').send({ name: 'hello-world' });

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: 'hello-world',
      }),
    );
    expect(Date.parse(response.body.created_at)).not.toBeNaN();
  });

  it('should persist the created record so it is returned by GET', async () => {
    const created = await request(app).post('/api/foo').send({ name: 'hello-world' });

    const response = await request(app).get('/api/foo');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: created.body.id, name: 'hello-world' }),
      ]),
    );
  });

  it.each([
    ['a missing name', {}],
    ['an empty name', { name: '' }],
    ['a whitespace-only name', { name: '   ' }],
    ['a non-string name', { name: 42 }],
  ])('should return 400 for %s', async (_label, body) => {
    const response = await request(app).post('/api/foo').send(body);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual(expect.any(String));
  });

  it('should return the most recently created record first', async () => {
    await request(app).post('/api/foo').send({ name: 'older' });
    const newer = await request(app).post('/api/foo').send({ name: 'newer' });

    const response = await request(app).get('/api/foo');

    expect(response.body[0].id).toBe(newer.body.id);
  });
});
