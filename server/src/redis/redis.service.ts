import { Injectable } from '@nestjs/common';
import type { OnModuleDestroy } from '@nestjs/common';
import { Socket, createConnection } from 'node:net';
import { connect as createTlsConnection } from 'node:tls';
import { URL } from 'node:url';

type RedisValue = string | null;

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly url: string | undefined;
  private socket: Socket | null = null;
  private connecting: Promise<Socket> | null = null;
  private buffer = Buffer.alloc(0);
  private queue: Array<{
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }> = [];

  constructor() {
    this.url = process.env.REDIS_URL;
    if (!this.url) {
      console.warn('[RedisService] REDIS_URL is not set. Redis operations will return null.');
    }
  }

  async get(key: string): Promise<RedisValue> {
    const value = await this.safeCommand(['GET', key]);
    return typeof value === 'string' ? value : null;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.safeCommand(['SET', key, value, 'EX', String(ttlSeconds)]);
    return result === 'OK';
  }

  async setNx(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.safeCommand(['SET', key, value, 'EX', String(ttlSeconds), 'NX']);
    return result === 'OK';
  }

  async del(key: string): Promise<boolean> {
    const result = await this.safeCommand(['DEL', key]);
    return typeof result === 'number' && result > 0;
  }

  async delByPattern(pattern: string): Promise<void> {
    const keys = await this.safeCommand(['KEYS', pattern]);
    if (!Array.isArray(keys) || keys.length === 0) return;
    await this.safeCommand(['DEL', ...keys.filter((key): key is string => typeof key === 'string')]);
  }

  async incr(key: string, ttlSeconds?: number): Promise<number | null> {
    const result = await this.safeCommand(['INCR', key]);
    if (typeof result !== 'number') return null;
    if (ttlSeconds && result === 1) await this.safeCommand(['EXPIRE', key, String(ttlSeconds)]);
    return result;
  }

  async rpush(key: string, value: string): Promise<boolean> {
    const result = await this.safeCommand(['RPUSH', key, value]);
    return typeof result === 'number';
  }

  async lpop(key: string): Promise<string | null> {
    const result = await this.safeCommand(['LPOP', key]);
    return typeof result === 'string' ? result : null;
  }

  async zadd(key: string, score: number, value: string): Promise<boolean> {
    const result = await this.safeCommand(['ZADD', key, String(score), value]);
    return typeof result === 'number';
  }

  async zrangeByScore(key: string, maxScore: number, limit: number): Promise<string[]> {
    const result = await this.safeCommand([
      'ZRANGEBYSCORE',
      key,
      '-inf',
      String(maxScore),
      'LIMIT',
      '0',
      String(limit),
    ]);
    return Array.isArray(result) ? result.filter((item): item is string => typeof item === 'string') : [];
  }

  async zrem(key: string, value: string): Promise<boolean> {
    const result = await this.safeCommand(['ZREM', key, value]);
    return typeof result === 'number';
  }

  async onModuleDestroy(): Promise<void> {
    this.socket?.destroy();
    this.socket = null;
  }

  private async safeCommand(args: string[]): Promise<unknown> {
    if (!this.url) return null;
    try {
      return await this.command(args);
    } catch (err) {
      console.error('Redis Error:', err);
      this.socket?.destroy();
      this.socket = null;
      this.connecting = null;
      this.queue.splice(0).forEach((item) => item.resolve(null));
      return null;
    }
  }

  private async command(args: string[]): Promise<unknown> {
    const socket = await this.getSocket();
    return this.rawCommand(socket, args);
  }

  private rawCommand(socket: Socket, args: string[]): Promise<unknown> {
    const payload = this.encode(args);
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject });
      socket.write(payload);
    });
  }

  private getSocket(): Promise<Socket> {
    if (this.socket && !this.socket.destroyed) return Promise.resolve(this.socket);
    if (this.connecting) return this.connecting;

    this.connecting = new Promise((resolve, reject) => {
      const parsed = new URL(this.url as string);
      const isTls = parsed.protocol === 'rediss:';
      const options: any = {
        host: parsed.hostname,
        port: Number(parsed.port || (isTls ? 6380 : 6379)),
      };
      if (isTls) {
        options.servername = parsed.hostname;
      }
      const socket = isTls ? createTlsConnection(options) : createConnection(options);

      socket.setTimeout(1500);
      const eventName = isTls ? 'secureConnect' : 'connect';
      socket.once(eventName, () => {
        socket.on('data', (chunk) => this.onData(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        socket.on('error', () => undefined);
        socket.on('timeout', () => socket.destroy());

        this.initializeConnection(socket, parsed)
          .then(() => {
            this.socket = socket;
            this.connecting = null;
            resolve(socket);
          })
          .catch((err) => {
            this.connecting = null;
            socket.destroy();
            reject(err as Error);
          });
      });
      socket.once('error', (err) => {
        this.connecting = null;
        reject(err);
      });
    });

    return this.connecting;
  }

  private async initializeConnection(socket: Socket, parsed: URL): Promise<void> {
    const username = decodeURIComponent(parsed.username || '');
    const password = decodeURIComponent(parsed.password || '');
    if (password) {
      await this.rawCommand(socket, username ? ['AUTH', username, password] : ['AUTH', password]);
    }

    const database = parsed.pathname.replace('/', '');
    if (database) {
      await this.rawCommand(socket, ['SELECT', database]);
    }
  }

  private onData(chunk: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);

    while (this.queue.length > 0) {
      const parsed = this.parse(this.buffer);
      if (!parsed) return;
      this.buffer = this.buffer.subarray(parsed.offset);
      const next = this.queue.shift();
      if (!next) return;
      if (parsed.value instanceof Error) next.reject(parsed.value);
      else next.resolve(parsed.value);
    }
  }

  private encode(args: string[]): string {
    return `*${args.length}\r\n${args
      .map((arg) => `$${Buffer.byteLength(arg)}\r\n${arg}\r\n`)
      .join('')}`;
  }

  private parse(buffer: Buffer): { value: unknown; offset: number } | null {
    if (buffer.length < 1) return null;
    const type = String.fromCharCode(buffer[0] as number);
    const lineEnd = buffer.indexOf('\r\n');
    if (lineEnd === -1) return null;
    const line = buffer.subarray(1, lineEnd).toString();
    const offset = lineEnd + 2;

    if (type === '+') return { value: line, offset };
    if (type === '-') return { value: new Error('Redis command failed'), offset };
    if (type === ':') return { value: Number(line), offset };
    if (type === '*') return this.parseArray(buffer, Number(line), offset);
    if (type !== '$') return { value: null, offset };

    const length = Number(line);
    if (length === -1) return { value: null, offset };
    const end = offset + length;
    if (buffer.length < end + 2) return null;
    return { value: buffer.subarray(offset, end).toString(), offset: end + 2 };
  }

  private parseArray(
    buffer: Buffer,
    length: number,
    offset: number,
  ): { value: unknown[]; offset: number } | null {
    if (length < 0) return { value: [], offset };
    const values: unknown[] = [];
    let currentOffset = offset;

    for (let index = 0; index < length; index += 1) {
      const parsed = this.parse(buffer.subarray(currentOffset));
      if (!parsed) return null;
      values.push(parsed.value);
      currentOffset += parsed.offset;
    }

    return { value: values, offset: currentOffset };
  }
}
