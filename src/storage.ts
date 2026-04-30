/**
 * Storage operations for configurations
 */

import { Config, Env } from './types';
import { generateToken } from './auth';

/**
 * Get configuration by ID
 */
export async function getConfig(env: Env, id: string): Promise<Config | null> {
  const data = await env.STORAGE.get(id);
  if (!data) return null;
  return JSON.parse(data) as Config;
}

/**
 * Create new configuration
 */
export async function createConfig(
  env: Env,
  id: string,
  name: string,
  config: any
): Promise<Config> {
  const now = new Date().toISOString();
  const newConfig: Config = {
    id,
    name,
    config,
    createdAt: now,
    updatedAt: now,
    subscriptions: [],
  };

  await env.STORAGE.put(id, JSON.stringify(newConfig));
  return newConfig;
}

/**
 * Update existing configuration
 */
export async function updateConfig(
  env: Env,
  id: string,
  updates: Partial<Omit<Config, 'id' | 'createdAt'>>
): Promise<Config | null> {
  const existing = await getConfig(env, id);
  if (!existing) return null;

  const updated: Config = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  await env.STORAGE.put(id, JSON.stringify(updated));
  return updated;
}

/**
 * Delete configuration
 */
export async function deleteConfig(env: Env, id: string): Promise<boolean> {
  const existing = await getConfig(env, id);
  if (!existing) return false;

  await env.STORAGE.delete(id);
  return true;
}

/**
 * Get configuration's config property (for subscription)
 */
export async function getConfigData(env: Env, id: string): Promise<any | null> {
  const config = await getConfig(env, id);
  if (!config) return null;
  return config.config;
}

/**
 * List all configuration IDs
 */
export async function listConfigIds(env: Env): Promise<string[]> {
  const keys = await env.STORAGE.list();
  return keys.keys.map(k => k.name);
}

