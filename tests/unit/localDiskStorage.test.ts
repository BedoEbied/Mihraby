import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const { LocalDiskStorage } = await import('@/lib/storage/LocalDiskStorage');

describe('LocalDiskStorage', () => {
  let tempDir: string | null = null;

  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
      tempDir = null;
    }
  });

  it('saves, reads, signs, and deletes files under the uploads directory', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mihraby-storage-'));
    const storage = new LocalDiskStorage({ uploadsDir: tempDir });

    const key = await storage.save({
      namespace: 'payment-proofs',
      originalFilename: 'proof.png',
      contentType: 'image/png',
      data: Buffer.from('proof-image'),
      metadata: { bookingId: '42' },
    });

    expect(key).toMatch(/^payment-proofs\/.+\.png$/);

    const file = await storage.read(key);
    const body = await streamToBuffer(file.stream);
    expect(body.toString()).toBe('proof-image');
    expect(file.contentType).toBe('image/png');
    expect(file.contentLength).toBe(Buffer.byteLength('proof-image'));

    const signedUrl = await storage.signedUrl(key);
    expect(signedUrl).toBe(`/api/admin/payment-proofs/${encodeURIComponent('42')}`);

    await storage.delete(key);
    await expect(storage.read(key)).rejects.toThrow('File not found');
  });
});

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
