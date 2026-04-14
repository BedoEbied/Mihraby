import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { UserRole } from '@/types';

const submitProof = vi.fn();
const read = vi.fn();
const findById = vi.fn();
const verifyToken = vi.fn();
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

vi.mock('@/lib/services/instapayService', () => ({
  InstapayService: {
    MAX_PAYMENT_PROOF_BYTES: 5 * 1024 * 1024,
    submitProof,
  },
}));

vi.mock('@/lib/composition', () => ({
  getFileStorage: vi.fn(() => ({ read })),
}));

vi.mock('@/lib/db/models/Booking', () => ({
  Booking: {
    findById,
  },
}));

vi.mock('@/lib/auth/server', () => ({
  verifyToken,
}));

const paymentProofRoute = await import('@/app/api/bookings/[id]/payment-proof/route');
const paymentProofStreamRoute = await import('@/app/api/admin/payment-proofs/[bookingId]/route');

describe('payment proof routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('rejects oversized payment proof uploads before parsing formData', async () => {
    verifyToken.mockReturnValue({ userId: 7, role: UserRole.STUDENT, email: 'student@example.com' });

    const request = new NextRequest('http://localhost:3000/api/bookings/42/payment-proof', {
      method: 'POST',
      headers: {
        authorization: 'Bearer token',
        'content-length': String(5 * 1024 * 1024 + 1),
      },
    });

    const formDataSpy = vi.spyOn(request, 'formData');
    const response = await paymentProofRoute.POST(request, {
      params: Promise.resolve({ id: '42' }),
    });

    const payload = await response.json();
    expect(response.status).toBe(400);
    expect(formDataSpy).not.toHaveBeenCalled();
    expect(submitProof).not.toHaveBeenCalled();
    expect(payload.message).toContain('5 MB');
  });

  it('blocks non-admin users from streaming payment proofs', async () => {
    verifyToken.mockReturnValue({ userId: 7, role: UserRole.STUDENT, email: 'student@example.com' });

    const request = new NextRequest('http://localhost:3000/api/admin/payment-proofs/42', {
      headers: {
        authorization: 'Bearer token',
      },
    });

    const response = await paymentProofStreamRoute.GET(request, {
      params: Promise.resolve({ bookingId: '42' }),
    });

    expect(response.status).toBe(403);
    expect(findById).not.toHaveBeenCalled();
    expect(read).not.toHaveBeenCalled();
  });
});
