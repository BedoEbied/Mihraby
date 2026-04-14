import { ApiError, ApiErrorCode } from '@/lib/api/errors';
import type {
  FileStorage,
  SaveFileInput,
  ReadFileResult,
  SignedUrlOptions,
} from './FileStorage';

/**
 * Null-object FileStorage used when STORAGE_ENABLED !== 'true'. Every method
 * throws a clearly-messaged 503 ApiError.
 *
 * Rationale: Railway's filesystem is ephemeral, and the PayPal launch path is
 * storage-free. InstaPay upload routes stay wired (so Egypt work isn't lost)
 * but return a loud, auditable 503 until R2Storage (post-launch track T3) is
 * implemented. This prevents silent data loss if anyone re-enables the upload
 * UI without first wiring durable object storage.
 */
export class DisabledStorage implements FileStorage {
  readonly name = 'disabled' as const;

  private fail(op: string): never {
    throw new ApiError(
      `File storage is disabled (op='${op}'). Set STORAGE_ENABLED=true and wire R2Storage to enable uploads.`,
      503,
      ApiErrorCode.SERVER_ERROR
    );
  }

  save(_input: SaveFileInput): Promise<string> {
    this.fail('save');
  }

  read(_key: string): Promise<ReadFileResult> {
    this.fail('read');
  }

  delete(_key: string): Promise<void> {
    this.fail('delete');
  }

  signedUrl(_key: string, _options?: SignedUrlOptions): Promise<string> {
    this.fail('signedUrl');
  }
}
