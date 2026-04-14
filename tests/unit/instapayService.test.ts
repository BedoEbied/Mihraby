import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/errors';
import type { IBooking } from '@/types';
import type { PoolConnection } from 'mysql2/promise';

const mockStorage = {
  name: 'local-disk' as const,
  save: vi.fn(),
  read: vi.fn(),
  delete: vi.fn(),
  signedUrl: vi.fn(),
};

const mockConn = { query: vi.fn() } as unknown as Pick<PoolConnection, 'query'>;

vi.mock('@/lib/db/models/Booking', () => ({
  Booking: {
    findById: vi.fn(),
    lockById: vi.fn(),
    updateFields: vi.fn(),
  },
}));

vi.mock('@/lib/db/transaction', () => ({
  withTransaction: vi.fn(async (fn: (conn: Pick<PoolConnection, 'query'>) => Promise<unknown>) => fn(mockConn)),
  isDuplicateEntryError: vi.fn(() => false),
}));

vi.mock('@/lib/composition', () => ({
  getFileStorage: vi.fn(() => mockStorage),
}));

const { Booking } = await import('@/lib/db/models/Booking');
const { InstapayService } = await import('@/lib/services/instapayService');

const NOW = new Date('2026-04-13T08:00:00Z');

function makeBooking(overrides: Partial<IBooking> = {}): IBooking {
  return {
    id: 42,
    user_id: 7,
    course_id: 10,
    slot_id: 4,
    payment_status: 'pending',
    payment_method: 'instapay',
    payment_id: null,
    transaction_id: null,
    amount: 150,
    meeting_link: null,
    meeting_id: null,
    meeting_platform: 'zoom',
    status: 'pending_review',
    booked_at: NOW,
    cancelled_at: null,
    instapay_reference: null,
    payment_proof_path: null,
    payment_proof_uploaded_at: null,
    admin_notes: null,
    ...overrides,
  };
}

describe('InstapayService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    mockStorage.save.mockResolvedValue('payment-proofs/42-proof.png');
    vi.mocked(Booking.updateFields).mockResolvedValue(true);
    vi.mocked(Booking.lockById).mockResolvedValue(makeBooking());
  });

  it('stores validated proof uploads for pending-review bookings owned by the student', async () => {
    vi.mocked(Booking.findById)
      .mockResolvedValueOnce(makeBooking())
      .mockResolvedValueOnce(
        makeBooking({
          instapay_reference: 'TX-123',
          payment_proof_path: 'payment-proofs/42-proof.png',
          payment_proof_uploaded_at: NOW,
        })
      );
    vi.mocked(Booking.lockById).mockResolvedValue(makeBooking());

    const result = await InstapayService.submitProof(42, 7, makeFile('proof.png', 'image/png', pngBytes()), 'TX-123');

    expect(mockStorage.save).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: 'payment-proofs',
        originalFilename: 'proof.png',
        contentType: 'image/png',
      })
    );
    expect(Booking.updateFields).toHaveBeenCalledWith(
      mockConn,
      42,
      expect.objectContaining({
        instapay_reference: 'TX-123',
        payment_proof_path: 'payment-proofs/42-proof.png',
        payment_proof_uploaded_at: NOW,
      })
    );
    expect(result.payment_proof_path).toBe('payment-proofs/42-proof.png');
    expect(result.instapay_reference).toBe('TX-123');
  });

  it('rejects uploads for bookings not owned by the student', async () => {
    vi.mocked(Booking.findById).mockResolvedValue(makeBooking({ user_id: 99 }));
    vi.mocked(Booking.lockById).mockResolvedValue(makeBooking({ user_id: 99 }));

    await expect(
      InstapayService.submitProof(42, 7, makeFile('proof.png', 'image/png', pngBytes()), 'TX-123')
    ).rejects.toThrow('Not authorized');
  });

  it('rejects uploads unless the booking is pending_review', async () => {
    vi.mocked(Booking.findById).mockResolvedValue(makeBooking({ status: 'confirmed' }));
    vi.mocked(Booking.lockById).mockResolvedValue(makeBooking({ status: 'confirmed' }));

    await expect(
      InstapayService.submitProof(42, 7, makeFile('proof.png', 'image/png', pngBytes()), 'TX-123')
    ).rejects.toThrow('pending review');
  });

  it('rejects invalid file signatures even if the mime type claims image/png', async () => {
    vi.mocked(Booking.findById).mockResolvedValue(makeBooking());
    vi.mocked(Booking.lockById).mockResolvedValue(makeBooking());

    await expect(
      InstapayService.submitProof(42, 7, makeFile('proof.png', 'image/png', Buffer.from('not-an-image')), 'TX-123')
    ).rejects.toThrow('Unsupported payment proof file');
  });

  it('rejects files over 5MB', async () => {
    vi.mocked(Booking.findById).mockResolvedValue(makeBooking());
    vi.mocked(Booking.lockById).mockResolvedValue(makeBooking());

    await expect(
      InstapayService.submitProof(
        42,
        7,
        {
          name: 'proof.png',
          type: 'image/png',
          size: 5 * 1024 * 1024 + 1,
          arrayBuffer: async () => pngBytes().buffer.slice(0),
        } as File,
        'TX-123'
      )
    ).rejects.toThrow('5 MB');
  });

  it('throws ApiError when the booking cannot be found', async () => {
    vi.mocked(Booking.findById).mockResolvedValue(null);
    vi.mocked(Booking.lockById).mockResolvedValue(null);

    await expect(
      InstapayService.submitProof(42, 7, makeFile('proof.png', 'image/png', pngBytes()), 'TX-123')
    ).rejects.toBeInstanceOf(ApiError);
  });
});

function makeFile(name: string, type: string, bytes: Buffer): File {
  return {
    name,
    type,
    size: bytes.byteLength,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as File;
}

function pngBytes(): Buffer {
  return Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
}
