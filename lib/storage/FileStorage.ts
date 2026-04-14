import type { Readable } from 'node:stream';

/**
 * Abstraction over a file storage backend. The MVP uses LocalDiskStorage (files
 * written to ./uploads, outside the Next.js public/ folder, served via an
 * admin-gated API route). A future R2Storage / S3Storage drop-in swap is
 * possible without touching any route or service.
 *
 * All methods operate on an "object key" — a stable, non-guessable identifier
 * that looks like `payment-proofs/123-abcd1234.jpg`. Keys are returned from
 * `save()` and passed to the other methods.
 */
export interface FileStorage {
  readonly name: 'local-disk' | 'r2' | 's3' | 'disabled';

  /**
   * Persist a file uploaded via multipart/form-data. Returns the object key
   * that should be stored in the database.
   *
   * Callers are expected to validate mime type and size BEFORE calling save()
   * — this interface is not responsible for policy.
   */
  save(input: SaveFileInput): Promise<string>;

  /**
   * Open a readable stream for an object. Throws if the key does not exist.
   * Callers are responsible for authorization before invoking this (e.g. the
   * admin-only payment-proof API route).
   */
  read(key: string): Promise<ReadFileResult>;

  /** Delete an object. Tolerate "not found" silently. */
  delete(key: string): Promise<void>;

  /**
   * Produce a URL a client can use to fetch the object. For local disk this is
   * our own `/api/admin/payment-proofs/[key]` route. For R2/S3 this is a
   * presigned URL with a short TTL.
   */
  signedUrl(key: string, options?: SignedUrlOptions): Promise<string>;
}

export interface SaveFileInput {
  /**
   * Logical folder ("payment-proofs", "course-covers", etc.). The implementation
   * prepends this to the generated key.
   */
  namespace: string;
  /** Original filename from the upload. Used only to extract the extension. */
  originalFilename: string;
  /** Mime type the caller has already validated. */
  contentType: string;
  /** File bytes. */
  data: Buffer | Readable;
  /** Optional extra metadata stored alongside the object (not all backends support this). */
  metadata?: Record<string, string>;
}

export interface ReadFileResult {
  stream: Readable;
  contentType: string;
  contentLength: number;
}

export interface SignedUrlOptions {
  /** URL TTL in seconds. Default is 5 minutes. */
  expiresIn?: number;
}
