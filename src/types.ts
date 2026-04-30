/**
 * Data types for configuration storage
 */

export interface Config {
  id: string;
  name: string;
  config: any; // 配置对象
  createdAt: string;
  updatedAt: string;
  subscriptions: any[];
}

export interface ConfigResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface CreateConfigRequest {
  uuid: string;
  token: string;
  name: string;
  config: any;
}

export interface UpdateConfigRequest {
  uuid: string;
  token: string;
  name?: string;
  config?: any;
}

export interface GetConfigRequest {
  uuid: string;
  token?: string;
}

export interface Env {
  STORAGE: KVNamespace;
  SECRET: string;
}

