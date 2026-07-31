import {
  Injectable,
  InternalServerErrorException,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { StorageBucket } from './storage.config';
import { StorageBuckets, StorageConfig } from './storage.config';

interface UploadObjectParams {
  bucket: StorageBucket;
  path: string;
  contentType: string;
  body: Buffer;
  originalName?: string;
  encoding?: string;
  size?: number;
}

interface UploadObjectResult {
  bucket: StorageBucket;
  path: string;
  response: unknown;
  verified: boolean;
}

interface SignedUrlParams {
  bucket?: StorageBucket;
  path: string;
  expiresInSeconds?: number;
}

interface DeleteObjectParams {
  bucket?: StorageBucket;
  path: string;
}

@Injectable()
export class SupabaseStorageService {
  private readonly supabaseUrl: string;
  private readonly serviceRoleKey: string;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url) throw new Error('SUPABASE_URL environment variable is required');
    if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    this.supabaseUrl = url.replace(/\/$/, '');
    this.serviceRoleKey = key;
  }

  async uploadObject(params: UploadObjectParams): Promise<UploadObjectResult> {
    if (params.body.length === 0) {
      throw new InternalServerErrorException('Storage upload aborted: file buffer is empty');
    }

    if (params.body.length > StorageConfig.maxUploadSizeBytes) {
      const limitMb = Math.round(StorageConfig.maxUploadSizeBytes / (1024 * 1024));
      throw new PayloadTooLargeException(`File exceeds the ${limitMb} MB upload limit`);
    }

    const response = await this.fetch(
      this.objectUrl(params.bucket, params.path),
      {
        method: 'POST',
        headers: {
          'Content-Type': params.contentType,
          'x-upsert': 'false',
        },
        body: new Uint8Array(params.body),
      },
    );

    const responseBody = await readResponseBody(response);

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Supabase storage upload failed: ${responseBody.raw || response.statusText}`,
      );
    }

    const verified = await this.objectExists(params.bucket, params.path);

    if (!verified) {
      throw new InternalServerErrorException(
        `Supabase upload reported success but object was not found at ${params.bucket}/${params.path}`,
      );
    }

    return { bucket: params.bucket, path: params.path, response: responseBody.data, verified };
  }

  async createSignedUrl(params: SignedUrlParams): Promise<string>;
  async createSignedUrl(path: string, expiresInSeconds?: number): Promise<string>;
  async createSignedUrl(
    pathOrParams: string | SignedUrlParams,
    expiresInSeconds?: number,
  ): Promise<string> {
    const bucket =
      typeof pathOrParams === 'string'
        ? StorageBuckets.CANDIDATE
        : (pathOrParams.bucket ?? StorageBuckets.CANDIDATE);
    const path = typeof pathOrParams === 'string' ? pathOrParams : pathOrParams.path;
    const expiry =
      (typeof pathOrParams === 'string' ? expiresInSeconds : pathOrParams.expiresInSeconds) ??
      StorageConfig.signedUrlExpiry;

    const response = await this.fetch(
      this.signUrl(bucket, path),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresIn: expiry }),
      },
    );

    const responseBody = await readResponseBody(response);

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Supabase signed URL failed: ${responseBody.raw || response.statusText}`,
      );
    }

    const payload = responseBody.data as { signedURL?: string; signedUrl?: string };
    const signedPath = payload.signedURL ?? payload.signedUrl;
    if (!signedPath) {
      throw new InternalServerErrorException('Storage returned an empty signed URL');
    }
    if (signedPath.startsWith('http://') || signedPath.startsWith('https://')) return signedPath;
    return `${this.storageUrl()}${signedPath}`;
  }

  async deleteObject(params: DeleteObjectParams): Promise<void>;
  async deleteObject(path: string): Promise<void>;
  async deleteObject(pathOrParams: string | DeleteObjectParams): Promise<void> {
    const bucket =
      typeof pathOrParams === 'string'
        ? StorageBuckets.CANDIDATE
        : (pathOrParams.bucket ?? StorageBuckets.CANDIDATE);
    const path = typeof pathOrParams === 'string' ? pathOrParams : pathOrParams.path;

    const response = await this.fetch(
      `${this.storageUrl()}/object/${bucket}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefixes: [path] }),
      },
    );

    const responseBody = await readResponseBody(response);
    if (!response.ok) {
      throw new InternalServerErrorException(
        `Supabase delete failed: ${responseBody.raw || response.statusText}`,
      );
    }
  }

  async objectExists(bucket: StorageBucket, path: string): Promise<boolean> {
    const prefix = dirname(path);
    const fileName = basename(path);
    const response = await this.fetch(
      `${this.storageUrl()}/object/list/${bucket}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prefix,
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        }),
      },
    );

    const responseBody = await readResponseBody(response);
    if (!response.ok) {
      throw new InternalServerErrorException(
        `Supabase list failed: ${responseBody.raw || response.statusText}`,
      );
    }

    const objects = Array.isArray(responseBody.data) ? responseBody.data : [];
    return objects.some((object: { name?: string }) => object.name === fileName);
  }

  private async fetch(url: string, init: RequestInit): Promise<Response> {
    const headers = {
      ...this.authHeaders(),
      ...(init.headers as Record<string, string>),
    };

    try {
      return await globalThis.fetch(url, { ...init, headers });
    } catch (error) {
      throw new ServiceUnavailableException(
        `Storage service is unavailable: ${error instanceof Error ? error.message : stringifyForLog(error)}`,
      );
    }
  }

  private objectUrl(bucket: StorageBucket, path: string): string {
    return `${this.storageUrl()}/object/${bucket}/${encodePath(path)}`;
  }

  private signUrl(bucket: StorageBucket, path: string): string {
    return `${this.storageUrl()}/object/sign/${bucket}/${encodePath(path)}`;
  }

  private storageUrl(): string {
    return `${this.supabaseUrl}/storage/v1`;
  }

  private authHeaders(): Record<string, string> {
    return {
      apikey: this.serviceRoleKey,
      Authorization: `Bearer ${this.serviceRoleKey}`,
    };
  }
}

function encodePath(path: string): string {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function dirname(path: string): string {
  const index = path.lastIndexOf('/');
  return index === -1 ? '' : path.slice(0, index);
}

function basename(path: string): string {
  const index = path.lastIndexOf('/');
  return index === -1 ? path : path.slice(index + 1);
}

async function readResponseBody(response: Response): Promise<{ raw: string; data: unknown; error: unknown }> {
  const raw = await response.text();
  if (!raw) return { raw, data: null, error: null };

  try {
    const data = JSON.parse(raw) as unknown;
    const error =
      data && typeof data === 'object' && 'error' in data
        ? (data as { error?: unknown }).error
        : !response.ok
          ? data
          : null;
    return { raw, data, error };
  } catch {
    return { raw, data: raw, error: response.ok ? null : raw };
  }
}

function stringifyForLog(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
