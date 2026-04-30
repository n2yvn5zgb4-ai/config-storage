/**
 * API request handlers
 */

import { Env, ConfigResponse, CreateConfigRequest, UpdateConfigRequest } from './types';
import { generateToken, verifyToken, extractToken, extractUUID } from './auth';
import {
  getConfig,
  createConfig,
  updateConfig,
  deleteConfig,
  getConfigData,
  listConfigIds,
} from './storage';

/**
 * Handle GET request - retrieve configuration
 */
export async function handleGet(request: Request, env: Env): Promise<Response> {
  const uuid = extractUUID(request);
  const token = extractToken(request);

  if (!uuid) {
    return jsonResponse({ success: false, error: 'Missing uuid parameter' }, 400);
  }

  try {
    // Verify token if provided
    if (token) {
      const isValid = await verifyToken(uuid, token, env.SECRET);
      if (!isValid) {
        return jsonResponse({ success: false, error: 'Invalid token' }, 401);
      }
    }

    const configData = await getConfigData(env, uuid);
    if (!configData) {
      return jsonResponse({ success: false, error: 'Configuration not found' }, 404);
    }

    // Return config object directly
    return new Response(JSON.stringify(configData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return jsonResponse(
      { success: false, error: `Failed to retrieve configuration: ${error}` },
      500
    );
  }
}

/**
 * Handle POST request - create or update configuration
 */
export async function handlePost(request: Request, env: Env): Promise<Response> {
  try {
    const body = (await request.json()) as CreateConfigRequest | UpdateConfigRequest;
    const { uuid, token, name, config } = body as any;

    if (!uuid || !token) {
      return jsonResponse({ success: false, error: 'Missing uuid or token' }, 400);
    }

    // Verify token
    const isValid = await verifyToken(uuid, token, env.SECRET);
    if (!isValid) {
      return jsonResponse({ success: false, error: 'Invalid token' }, 401);
    }

    // Check if config exists
    const existing = await getConfig(env, uuid);

    if (existing) {
      // Update existing
      if (!name && !config) {
        return jsonResponse({ success: false, error: 'No fields to update' }, 400);
      }

      const updated = await updateConfig(env, uuid, {
        ...(name && { name }),
        ...(config && { config }),
      });

      return jsonResponse(
        { success: true, message: 'Configuration updated', data: updated },
        200
      );
    } else {
      // Create new
      if (!name || !config) {
        return jsonResponse(
          { success: false, error: 'Missing name or config for new configuration' },
          400
        );
      }

      const created = await createConfig(env, uuid, name, config);
      return jsonResponse(
        { success: true, message: 'Configuration created', data: created },
        201
      );
    }
  } catch (error) {
    return jsonResponse(
      { success: false, error: `Failed to process request: ${error}` },
      500
    );
  }
}

/**
 * Handle DELETE request - delete configuration
 */
export async function handleDelete(request: Request, env: Env): Promise<Response> {
  const uuid = extractUUID(request);
  const token = extractToken(request);

  if (!uuid || !token) {
    return jsonResponse({ success: false, error: 'Missing uuid or token' }, 400);
  }

  try {
    // Verify token
    const isValid = await verifyToken(uuid, token, env.SECRET);
    if (!isValid) {
      return jsonResponse({ success: false, error: 'Invalid token' }, 401);
    }

    const deleted = await deleteConfig(env, uuid);
    if (!deleted) {
      return jsonResponse({ success: false, error: 'Configuration not found' }, 404);
    }

    return jsonResponse({ success: true, message: 'Configuration deleted' });
  } catch (error) {
    return jsonResponse(
      { success: false, error: `Failed to delete configuration: ${error}` },
      500
    );
  }
}

/**
 * Helper function to return JSON response
 */
function jsonResponse(data: ConfigResponse, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

