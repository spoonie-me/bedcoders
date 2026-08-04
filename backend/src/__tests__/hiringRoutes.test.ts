// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';

/**
 * Assembly-level checks for the hiring routes.
 *
 * These do not touch the database. Every case here is answered by middleware
 * before a query is reached, which is the point: the auth and ordering
 * guarantees should hold without any data existing.
 *
 * The route-ordering case is not hypothetical — `GET /api/jobs/:id` shadowed
 * `/api/jobs/manage` on the first pass, which would have turned the employer
 * job console into a 404.
 */

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  // Set before importing the app: several modules construct SDK clients at
  // import time and throw on a missing key.
  process.env.JWT_SECRET ??= 'test-secret-that-is-long-enough-for-hs256';
  process.env.DATABASE_URL ??= 'postgresql://user:pass@localhost:5432/db?schema=bedcoders';
  process.env.STRIPE_SECRET_KEY ??= 'sk_test_dummy';
  process.env.RESEND_API_KEY ??= 're_dummy';
  process.env.ANTHROPIC_API_KEY ??= 'sk-ant-dummy';
  // server.ts calls app.listen(PORT) at import time unless it thinks it is on
  // Vercel. Without this the suite would bind port 3000 as a side effect of
  // importing, and fail wherever that port is already in use.
  process.env.VERCEL ??= '1';

  const app = (await import('../server.js')).default;
  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

const get = (path: string, headers: Record<string, string> = {}) =>
  fetch(`${baseUrl}${path}`, { headers });

const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

describe('route mounting', () => {
  it('serves the employer job console rather than matching it as a job id', async () => {
    // A 404 here would mean `/:id` swallowed `/manage`.
    const res = await get('/api/jobs/manage');
    expect(res.status).toBe(401);
  });

  it('mounts the employer auth routes', async () => {
    const res = await post('/api/employers/login', {});
    expect(res.status).toBe(400);
  });
});

describe('the employer surfaces reject unauthenticated callers', () => {
  const employerOnly: Array<[string, string]> = [
    ['GET', '/api/directory/talent'],
    ['GET', '/api/directory/talent/srs-abc123'],
    ['GET', '/api/directory/intros'],
    ['GET', '/api/directory/skill-demand'],
    ['GET', '/api/jobs/manage'],
    ['GET', '/api/employers/me'],
  ];

  it.each(employerOnly)('%s %s → 401', async (method, path) => {
    const res = await fetch(`${baseUrl}${path}`, { method });
    expect(res.status).toBe(401);
  });

  it('rejects a learner token on an employer endpoint', async () => {
    // Employer tokens carry `employerId` and an `employer` audience; a
    // learner token has neither, so it must not authenticate here even though
    // it is signed with the same secret.
    const jwt = (await import('jsonwebtoken')).default;
    const learnerToken = jwt.sign({ userId: 'user_1' }, process.env.JWT_SECRET as string, {
      expiresIn: 3600,
    });

    const res = await get('/api/directory/talent', {
      Authorization: `Bearer ${learnerToken}`,
    });
    expect(res.status).toBe(401);
  });
});

describe('the learner surfaces reject unauthenticated callers', () => {
  const learnerOnly: Array<[string, string]> = [
    ['GET', '/api/talent/me'],
    ['GET', '/api/talent/me/preview'],
    ['GET', '/api/talent/me/intros'],
    ['GET', '/api/talent/me/applications'],
    ['GET', '/api/talent/me/suggestions'],
    ['GET', '/api/jobs/me/applied-ids'],
  ];

  it.each(learnerOnly)('%s %s → 401', async (method, path) => {
    const res = await fetch(`${baseUrl}${path}`, { method });
    expect(res.status).toBe(401);
  });

  it('rejects an employer token on a learner endpoint', async () => {
    const jwt = (await import('jsonwebtoken')).default;
    const employerToken = jwt.sign(
      { employerId: 'emp_1' },
      process.env.JWT_SECRET as string,
      { expiresIn: 3600, audience: 'employer' },
    );

    const res = await get('/api/talent/me', { Authorization: `Bearer ${employerToken}` });
    expect(res.status).toBe(401);
  });
});

describe('the job board stays public', () => {
  it('does not require auth to browse', async () => {
    // This one call reaches the route body and fails on the absent database,
    // which the handler logs. Expected — silence it so the suite output stays
    // readable rather than looking like something broke.
    const consoleError = console.error;
    console.error = () => {};
    try {
      const res = await get('/api/jobs');
      // A 500 here is the missing database. A 401 would mean the board had
      // been accidentally gated, which is the thing worth catching.
      expect(res.status).not.toBe(401);
    } finally {
      console.error = consoleError;
    }
  });
});
