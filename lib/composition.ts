/**
 * Composition root — wires concrete implementations to the abstractions used
 * by services and routes. This is the ONLY place in the app where concrete
 * gateway / meeting / storage classes should be imported.
 *
 * Everywhere else:
 *   import { getPaymentGateway } from '@/lib/composition';
 *   const gateway = getPaymentGateway();
 *
 * To swap implementations (e.g. Paymob → Kashier, local disk → R2), change a
 * single line here.
 *
 * Implementations are created lazily and cached as module-level singletons.
 * They are intentionally NOT created at import time — this keeps type-checking
 * happy while later phases are still unwiring their concrete classes.
 */

import type { PaymentGateway } from '@/lib/services/payments/PaymentGateway';
import type { MeetingProvider } from '@/lib/services/meetings/MeetingProvider';
import type { FileStorage } from '@/lib/storage/FileStorage';

let paymentGateway: PaymentGateway | null = null;
let meetingProvider: MeetingProvider | null = null;
let fileStorage: FileStorage | null = null;

/**
 * Returns the active payment gateway for the current environment.
 *
 * When PAYMOB_API_KEY is set, uses the live PaymobGateway.
 * Otherwise falls back to MockPaymentGateway for local development.
 */
export function getPaymentGateway(): PaymentGateway {
  if (!paymentGateway) {
    if (process.env.PAYMOB_API_KEY) {
      const { PaymobGateway } = require('@/lib/services/payments/PaymobGateway');
      paymentGateway = new PaymobGateway({
        apiKey: process.env.PAYMOB_API_KEY,
        integrationIds: {
          card: process.env.PAYMOB_INTEGRATION_ID_CARD!,
          wallet: process.env.PAYMOB_INTEGRATION_ID_WALLET!,
          fawry: process.env.PAYMOB_INTEGRATION_ID_FAWRY!,
        },
        iframeId: process.env.PAYMOB_IFRAME_ID!,
        hmacSecret: process.env.PAYMOB_HMAC_SECRET!,
      });
      console.log('[composition] PaymentGateway: PaymobGateway (live)');
    } else {
      const { MockPaymentGateway } = require('@/lib/services/payments/MockPaymentGateway');
      paymentGateway = new MockPaymentGateway();
      console.log('[composition] PaymentGateway: MockPaymentGateway (dev)');
    }
  }
  return paymentGateway!;
}

/** Test / phased-rollout hook. Prefer configuration over direct calls. */
export function setPaymentGateway(gateway: PaymentGateway): void {
  paymentGateway = gateway;
}

/**
 * Returns the active meeting provider for the current environment.
 * Wired in Phase 5.
 */
export function getMeetingProvider(): MeetingProvider {
  if (!meetingProvider) {
    throw new Error(
      'MeetingProvider is not wired yet. Implement ZoomProvider (Phase 5) and register it in lib/composition.ts.'
    );
  }
  return meetingProvider;
}

export function setMeetingProvider(provider: MeetingProvider): void {
  meetingProvider = provider;
}

/**
 * Returns the active file storage for the current environment.
 * Wired in Phase 4.
 */
export function getFileStorage(): FileStorage {
  if (!fileStorage) {
    throw new Error(
      'FileStorage is not wired yet. Implement LocalDiskStorage (Phase 4) and register it in lib/composition.ts.'
    );
  }
  return fileStorage;
}

export function setFileStorage(storage: FileStorage): void {
  fileStorage = storage;
}
