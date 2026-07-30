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

  async uploadObject(params: UploadObjectParams): Promise<void> {
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

    if (!response.ok) {
      throw new InternalServerErrorException('Failed to upload file to storage');
    }
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

    if (!response.ok) {
      throw new InternalServerErrorException('Failed to generate signed URL');
    }

    const payload = (await response.json()) as { signedURL?: string; signedUrl?: string };
    const signedPath = payload.signedURL ?? payload.signedUrl;
    if (!signedPath) {
      throw new InternalServerErrorException('Storage returned an empty signed URL');
    }
    if (signedPath.startsWith('http://') || signedPath.startsWith('https://')) return signedPath;
    return `${this.supabaseUrl}${signedPath}`;
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

    if (!response.ok) {
      throw new InternalServerErrorException('Failed to delete file from storage');
    }
  }

  private async fetch(url: string, init: RequestInit): Promise<Response> {
    const headers = {
      ...this.authHeaders(),
      ...(init.headers as Record<string, string>),
    };

    try {
      return await globalThis.fetch(url, { ...init, headers });
    } catch {
      throw new ServiceUnavailableException('Storage service is unavailable');
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
