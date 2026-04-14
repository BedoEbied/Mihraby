import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import type { FileStorage, ReadFileResult, SaveFileInput, SignedUrlOptions } from './FileStorage';

const DEFAULT_UPLOADS_DIR = './uploads';

const MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

type LocalDiskStorageOptions = {
  uploadsDir?: string;
};

export class LocalDiskStorage implements FileStorage {
  readonly name = 'local-disk' as const;
  private readonly uploadsDir: string;

  constructor(options: LocalDiskStorageOptions = {}) {
    this.uploadsDir = path.resolve(options.uploadsDir ?? process.env.UPLOADS_DIR ?? DEFAULT_UPLOADS_DIR);
  }

  async save(input: SaveFileInput): Promise<string> {
    const ext = getExtension(input.originalFilename, input.contentType);
    const prefix = input.metadata?.bookingId ? `${sanitizeSegment(input.metadata.bookingId)}-` : '';
    const key = `${sanitizeSegment(input.namespace)}/${prefix}${crypto.randomUUID()}${ext}`;
    const absPath = this.toAbsolutePath(key);

    await fs.mkdir(path.dirname(absPath), { recursive: true });
    const bytes = await toBuffer(input.data);
    await fs.writeFile(absPath, bytes);

    return key;
  }

  async read(key: string): Promise<ReadFileResult> {
    const absPath = this.toAbsolutePath(key);
    try {
      const stat = await fs.stat(absPath);
      return {
        stream: createReadStream(absPath),
        contentType: detectContentType(absPath),
        contentLength: stat.size,
      };
    } catch {
      throw new Error(`File not found: ${key}`);
    }
  }

  async delete(key: string): Promise<void> {
    const absPath = this.toAbsolutePath(key);
    try {
      await fs.rm(absPath, { force: true });
    } catch {
      // local-disk delete is idempotent by contract
    }
  }

  async signedUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    void options;
    const bookingId = extractBookingId(key);
    return bookingId
      ? `/api/admin/payment-proofs/${encodeURIComponent(bookingId)}`
      : `/api/admin/payment-proofs/${encodeURIComponent(key)}`;
  }

  private toAbsolutePath(key: string): string {
    const normalized = key.replace(/\\/g, '/');
    const absPath = path.resolve(this.uploadsDir, normalized);
    const rootWithSep = `${this.uploadsDir}${path.sep}`;
    if (absPath !== this.uploadsDir && !absPath.startsWith(rootWithSep)) {
      throw new Error(`Invalid storage key: ${key}`);
    }
    return absPath;
  }
}

function sanitizeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-');
}

function getExtension(originalFilename: string, contentType: string): string {
  const ext = path.extname(originalFilename || '').toLowerCase();
  if (ext) return ext;
  return MIME_EXTENSION[contentType] ?? '.bin';
}

function detectContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}

async function toBuffer(data: SaveFileInput['data']): Promise<Buffer> {
  if (Buffer.isBuffer(data)) return data;
  const chunks: Buffer[] = [];
  for await (const chunk of data) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function extractBookingId(key: string): string | null {
  const match = key.match(/^payment-proofs\/([^/]+?)-/);
  return match?.[1] ?? null;
}

export default LocalDiskStorage;
