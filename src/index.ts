/**
 * Configuration Storage API
 *
 * A Cloudflare Worker that provides a simple API for storing and retrieving
 * configurations with token-based authentication.
 */

import { Env } from './types';
import { handleGet, handlePost, handleDelete } from './handlers';
import { extractToken, verifyToken } from './auth';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
			});
		}

		const url = new URL(request.url);
		const pathname = url.pathname;

		// Route: GET /api/config/{uuid} - Get configuration
		if (request.method === 'GET' && pathname.match(/^\/api\/config\/[^/]+$/)) {
			return handleGet(request, env);
		}

		// Route: POST /api/config - Create or update configuration
		if (request.method === 'POST' && pathname === '/api/config') {
			return handlePost(request, env);
		}

		// Route: DELETE /api/config/{uuid} - Delete configuration
		if (request.method === 'DELETE' && pathname.match(/^\/api\/config\/[^/]+$/)) {
			return handleDelete(request, env);
		}

		// Route: GET / - Health check (requires token)
		if (request.method === 'GET' && pathname === '/') {
			const token = extractToken(request);

			if (!token) {
				return new Response(JSON.stringify({ success: false, error: 'Missing token' }), {
					status: 401,
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
					},
				});
			}

			// Verify token using a fixed health check ID
			const isValid = await verifyToken('health-check', token, env.SECRET);
			if (!isValid) {
				return new Response(JSON.stringify({ success: false, error: 'Invalid token' }), {
					status: 401,
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
					},
				});
			}

			return new Response(JSON.stringify({ status: 'ok', service: 'config-storage' }), {
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
				},
			});
		}

		// 404 Not Found
		return new Response(JSON.stringify({ success: false, error: 'Not found' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' },
		});
	},
} satisfies ExportedHandler<Env>;
