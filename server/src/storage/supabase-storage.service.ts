import { Injectable, InternalServerErrorException } from '@nestjs/common';

interface UploadObjectParams {
  path: string;
  contentType: string;
  body: Buffer;
}

@Injectable()
export class SupabaseStorageService {
  private readonly supabaseUrl = process.env.SUPABASE_URL;
  private readonly serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  private readonly bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'candidate-files';

  async uploadObject(params: UploadObjectParams): Promise<void> {
    const response = await fetch(this.objectUrl(params.path), {
      method: 'POST',
      headers: {
        ...this.headers(),
        'Content-Type': params.contentType,
        'x-upsert': 'false',
      },
      body: new Uint8Array(params.body),
    });

    if (!response.ok) throw new InternalServerErrorException('Internal Server Error');
  }

  async createSignedUrl(path: string, expiresInSeconds = 900): Promise<string> {
    const response = await fetch(this.signUrl(path), {
      method: 'POST',
      headers: {
        ...this.headers(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expiresIn: expiresInSeconds }),
    });

    if (!response.ok) throw new InternalServerErrorException('Internal Server Error');

    const payload = (await response.json()) as { signedURL?: string; signedUrl?: string };
    const signedPath = payload.signedURL ?? payload.signedUrl;
    if (!signedPath) throw new InternalServerErrorException('Internal Server Error');
    if (signedPath.startsWith('http://') || signedPath.startsWith('https://')) return signedPath;
    return `${this.requireUrl()}${signedPath}`;
  }

  async deleteObject(path: string): Promise<void> {
    const response = await fetch(`${this.storageUrl()}/object/${this.bucket}`, {
      method: 'DELETE',
      headers: {
        ...this.headers(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefixes: [path] }),
    });

    if (!response.ok) throw new InternalServerErrorException('Internal Server Error');
  }

  private objectUrl(path: string): string {
    return `${this.storageUrl()}/object/${this.bucket}/${encodePath(path)}`;
  }

  private signUrl(path: string): string {
    return `${this.storageUrl()}/object/sign/${this.bucket}/${encodePath(path)}`;
  }

  private storageUrl(): string {
    return `${this.requireUrl()}/storage/v1`;
  }

  private requireUrl(): string {
    if (!this.supabaseUrl) throw new InternalServerErrorException('Internal Server Error');
    return this.supabaseUrl.replace(/\/$/, '');
  }

  private headers(): Record<string, string> {
    if (!this.serviceRoleKey) throw new InternalServerErrorException('Internal Server Error');
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
