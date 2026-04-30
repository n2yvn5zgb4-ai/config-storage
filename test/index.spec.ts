import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, beforeEach } from 'vitest';
import worker from '../src/index';
import { generateToken } from '../src/auth';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('Config Storage API', () => {
	let testUUID: string;
	let testToken: string;

	beforeEach(async () => {
		testUUID = 'test-uuid-123';
		// Use the SECRET from env, or default to test-secret-key
		const secret = env.SECRET || 'test-secret-key';
		testToken = await generateToken(testUUID, secret);
	});

	describe('Health Check', () => {
		it('responds with status ok on GET / with valid token', async () => {
			const secret = env.SECRET || 'test-secret-key';
			const healthToken = await generateToken('health-check', secret);

			const request = new IncomingRequest(`http://example.com/?token=${healthToken}`);
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(200);
			const data = await response.json();
			expect(data.status).toBe('ok');
			expect(data.service).toBe('config-storage');
		});

		it('returns 401 on GET / without token', async () => {
			const request = new IncomingRequest('http://example.com/');
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(401);
			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe('Missing token');
		});

		it('returns 401 on GET / with invalid token', async () => {
			const request = new IncomingRequest('http://example.com/?token=invalid-token');
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(401);
			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe('Invalid token');
		});
	});

	describe('CORS Preflight', () => {
		it('handles OPTIONS request', async () => {
			const request = new IncomingRequest('http://example.com/api/config', {
				method: 'OPTIONS',
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(204);
			expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
			expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
		});
	});

	describe('POST /api/config - Create Configuration', () => {
		it('creates a new configuration with valid token', async () => {
			const payload = {
				uuid: testUUID,
				token: testToken,
				name: 'Test Config',
				config: { test: 'data' },
			};

			const request = new IncomingRequest('http://example.com/api/config', {
				method: 'POST',
				body: JSON.stringify(payload),
				headers: { 'Content-Type': 'application/json' },
			});

			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);

			expect(response.status).toBe(201);
			const data = await response.json();
			expect(data.success).toBe(true);
			expect(data.data.id).toBe(testUUID);
			expect(data.data.name).toBe('Test Config');
		});

		it('rejects request with invalid token', async () => {
			const payload = {
				uuid: testUUID,
				token: 'invalid-token',
				name: 'Test Config',
				config: { test: 'data' },
			};

			const request = new IncomingRequest('http://example.com/api/config', {
				method: 'POST',
				body: JSON.stringify(payload),
				headers: { 'Content-Type': 'application/json' },
			});

			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);

			expect(response.status).toBe(401);
			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toContain('Invalid token');
		});

		it('rejects request with missing uuid or token', async () => {
			const payload = {
				name: 'Test Config',
				config: { test: 'data' },
			};

			const request = new IncomingRequest('http://example.com/api/config', {
				method: 'POST',
				body: JSON.stringify(payload),
				headers: { 'Content-Type': 'application/json' },
			});

			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);

			expect(response.status).toBe(400);
			const data = await response.json();
			expect(data.success).toBe(false);
		});
	});

	describe('GET /api/config/{uuid} - Retrieve Configuration', () => {
		it('retrieves configuration without token', async () => {
			// First create a config
			const createPayload = {
				uuid: testUUID,
				token: testToken,
				name: 'Test Config',
				config: { test: 'data' },
			};

			const createRequest = new IncomingRequest('http://example.com/api/config', {
				method: 'POST',
				body: JSON.stringify(createPayload),
				headers: { 'Content-Type': 'application/json' },
			});

			const createCtx = createExecutionContext();
			await worker.fetch(createRequest, env, createCtx);
			await waitOnExecutionContext(createCtx);

			// Then retrieve it
			const getRequest = new IncomingRequest(
				`http://example.com/api/config/${testUUID}`
			);
			const getCtx = createExecutionContext();
			const response = await worker.fetch(getRequest, env, getCtx);
			await waitOnExecutionContext(getCtx);

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(data).toEqual({ test: 'data' });
		});

		it('returns 404 for non-existent configuration', async () => {
			const request = new IncomingRequest(
				'http://example.com/api/config/non-existent-uuid'
			);
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);

			expect(response.status).toBe(404);
			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe('Configuration not found');
		});
	});

	describe('DELETE /api/config/{uuid} - Delete Configuration', () => {
		it('deletes configuration with valid token', async () => {
			// First create a config
			const createPayload = {
				uuid: testUUID,
				token: testToken,
				name: 'Test Config',
				config: { test: 'data' },
			};

			const createRequest = new IncomingRequest('http://example.com/api/config', {
				method: 'POST',
				body: JSON.stringify(createPayload),
				headers: { 'Content-Type': 'application/json' },
			});

			const createCtx = createExecutionContext();
			await worker.fetch(createRequest, env, createCtx);
			await waitOnExecutionContext(createCtx);

			// Then delete it
			const deleteRequest = new IncomingRequest(
				`http://example.com/api/config/${testUUID}?token=${testToken}`,
				{ method: 'DELETE' }
			);
			const deleteCtx = createExecutionContext();
			const response = await worker.fetch(deleteRequest, env, deleteCtx);
			await waitOnExecutionContext(deleteCtx);

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(data.success).toBe(true);
		});

		it('rejects delete with invalid token', async () => {
			const request = new IncomingRequest(
				`http://example.com/api/config/${testUUID}?token=invalid-token`,
				{ method: 'DELETE' }
			);
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);

			expect(response.status).toBe(401);
			const data = await response.json();
			expect(data.success).toBe(false);
		});
	});

	describe('404 Not Found', () => {
		it('returns 404 for unknown routes', async () => {
			const request = new IncomingRequest('http://example.com/unknown-route');
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);

			expect(response.status).toBe(404);
			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe('Not found');
		});
	});
});
