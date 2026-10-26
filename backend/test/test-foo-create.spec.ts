import request from 'supertest';
import app from '../src/app';

const VALID_BODY = {
  name: 'hello-world',
  description: 'a short description',
  category: 'internal',
  priority: 'high',
  is_active: false,
};

const DESCRIPTION_LIMIT = 500;

describe('POST /api/foo', () => {
  it('should return 201 and the created record', async () => {
    const response = await request(app).post('/api/foo').send(VALID_BODY);

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(Number),
      name: 'hello-world',
      description: 'a short description',
      category: 'internal',
      priority: 'high',
      is_active: false,
      created_at: expect.any(String),
    });
    expect(Date.parse(response.body.created_at)).not.toBeNaN();
  });

  it('should trim the name and description before storing them', async () => {
    const response = await request(app)
      .post('/api/foo')
      .send({ ...VALID_BODY, name: '  padded  ', description: '  padded  ' });

    expect(response.statusCode).toBe(201);
    expect(response.body.name).toBe('padded');
    expect(response.body.description).toBe('padded');
  });

  it.each([
    ['an omitted description', undefined],
    ['a null description', null],
    ['an empty description', ''],
    ['a whitespace-only description', '   '],
  ])('should store null for %s', async (_label, description) => {
    const response = await request(app)
      .post('/api/foo')
      .send({ ...VALID_BODY, description });

    expect(response.statusCode).toBe(201);
    expect(response.body.description).toBeNull();
  });

  it('should accept a description at the length limit', async () => {
    const description = 'a'.repeat(DESCRIPTION_LIMIT);

    const response = await request(app)
      .post('/api/foo')
      .send({ ...VALID_BODY, description });

    expect(response.statusCode).toBe(201);
    expect(response.body.description).toBe(description);
  });

  it('should persist the created record so it is returned by GET', async () => {
    const created = await request(app).post('/api/foo').send(VALID_BODY);

    const response = await request(app).get('/api/foo');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(expect.arrayContaining([created.body]));
  });

  it.each([
    ['a missing name', { name: undefined }],
    ['an empty name', { name: '' }],
    ['a whitespace-only name', { name: '   ' }],
    ['a non-string name', { name: 42 }],
  ])('should return the same name error for %s', async (_label, overrides) => {
    const response = await request(app)
      .post('/api/foo')
      .send({ ...VALID_BODY, ...overrides });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      code: 'FOO_NAME_INVALID',
      message: 'name is required and must be a non-empty string',
    });
  });

  it.each([
    ['a numeric description', { description: 42 }],
    ['an object description', { description: {} }],
    [
      'a description over the length limit',
      { description: 'a'.repeat(DESCRIPTION_LIMIT + 1) },
    ],
  ])('should return the same description error for %s', async (_label, overrides) => {
    const response = await request(app)
      .post('/api/foo')
      .send({ ...VALID_BODY, ...overrides });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      code: 'FOO_DESCRIPTION_INVALID',
      message: 'description must be a string of at most 500 characters',
    });
  });

  it.each([
    ['a missing category', { category: undefined }],
    ['an empty category', { category: '' }],
    ['an unknown category', { category: 'bogus' }],
    ['a non-string category', { category: 42 }],
  ])('should return the same category error for %s', async (_label, overrides) => {
    const response = await request(app)
      .post('/api/foo')
      .send({ ...VALID_BODY, ...overrides });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      code: 'FOO_CATEGORY_INVALID',
      message: 'category is required and must be one of general, internal, external',
    });
  });

  it.each([
    ['a missing priority', { priority: undefined }],
    ['an empty priority', { priority: '' }],
    ['an unknown priority', { priority: 'urgent' }],
    ['a non-string priority', { priority: 3 }],
  ])('should return the same priority error for %s', async (_label, overrides) => {
    const response = await request(app)
      .post('/api/foo')
      .send({ ...VALID_BODY, ...overrides });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      code: 'FOO_PRIORITY_INVALID',
      message: 'priority is required and must be one of low, medium, high',
    });
  });

  it.each([
    ['a missing is_active', { is_active: undefined }],
    ['a string is_active', { is_active: 'true' }],
    ['a numeric is_active', { is_active: 1 }],
    ['a null is_active', { is_active: null }],
  ])('should return the same is_active error for %s', async (_label, overrides) => {
    const response = await request(app)
      .post('/api/foo')
      .send({ ...VALID_BODY, ...overrides });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      code: 'FOO_IS_ACTIVE_INVALID',
      message: 'is_active is required and must be a boolean',
    });
  });

  it('should report the name error first when name and category are both invalid', async () => {
    const response = await request(app)
      .post('/api/foo')
      .send({ ...VALID_BODY, name: '', category: 'bogus' });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      code: 'FOO_NAME_INVALID',
      message: 'name is required and must be a non-empty string',
    });
  });

  it('should return the most recently created record first', async () => {
    await request(app)
      .post('/api/foo')
      .send({ ...VALID_BODY, name: 'older' });
    const newer = await request(app)
      .post('/api/foo')
      .send({ ...VALID_BODY, name: 'newer' });

    const response = await request(app).get('/api/foo');

    expect(response.body[0].id).toBe(newer.body.id);
  });
});
