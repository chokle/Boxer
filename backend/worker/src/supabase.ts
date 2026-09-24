// Supabase client (service role — bypasses RLS, as the worker acts on
// behalf of the system, not the end user) plus a storage adapter seam so
// the pipeline can be tested without a live Supabase project.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type DbClient = SupabaseClient;

export function createDbClient(url: string, serviceRoleKey: string): DbClient {
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface StorageAdapter {
  download(bucket: string, path: string): Promise<Buffer>;
  upload(bucket: string, path: string, data: Buffer, contentType: string): Promise<void>;
}

export class SupabaseStorageAdapter implements StorageAdapter {
  constructor(private readonly db: DbClient) {}

  async download(bucket: string, path: string): Promise<Buffer> {
    const { data, error } = await this.db.storage.from(bucket).download(path);
    if (error || !data) {
      throw new Error(`storage download failed: ${bucket}/${path}: ${error?.message ?? 'empty'}`);
    }
    return Buffer.from(await data.arrayBuffer());
  }

  async upload(bucket: string, path: string, data: Buffer, contentType: string): Promise<void> {
    const { error } = await this.db.storage.from(bucket).upload(path, data, {
      contentType,
      upsert: true,
    });
    if (error) {
      throw new Error(`storage upload failed: ${bucket}/${path}: ${error.message}`);
    }
  }
}
