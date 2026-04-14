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
import { PaymobGateway } from '@/lib/services/payments/PaymobGateway';
import { PayPalGateway } from '@/lib/services/payments/PayPalGateway';
import { MockPaymentGateway } from '@/lib/services/payments/MockPaymentGateway';
import { LocalDiskStorage } from '@/lib/storage/LocalDiskStorage';
import { DisabledStorage } from '@/lib/storage/DisabledStorage';

let paymentGateway: PaymentGateway | null = null;
let meetingProvider: MeetingProvider | null = null;
let fileStorage: FileStorage | null = null;

/**
 * Returns the active payment gateway for the current environment.
 *
 * Selection order (US launch):
 *   1. PAYPAL_CLIENT_ID + PAYPAL_CLIENT_SECRET set → PayPalGateway (US/USD)
 *   2. PAYMOB_API_KEY set → PaymobGateway (legacy Egypt flow, dormant at launch)
 *   3. otherwise → MockPaymentGateway (local dev)
 */
export function getPaymentGateway(): PaymentGateway {
  if (!paymentGateway) {
    if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
      const env = (process.env.PAYPAL_ENV ?? 'sandbox') as 'sandbox' | 'live';
      paymentGateway = new PayPalGateway({
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
        environment: env,
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      });
      console.log(`[composition] PaymentGateway: PayPalGateway (${env})`);
    } else if (process.env.PAYMOB_API_KEY) {
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
      console.log('[composition] PaymentGateway: PaymobGateway (legacy)');
    } else {
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
 *
 * Selection:
 *   - STORAGE_ENABLED !== 'true' → DisabledStorage (default at US launch —
 *     PayPal path is storage-free, Railway filesystem is ephemeral).
 *   - STORAGE_ENABLED === 'true' → LocalDiskStorage (local dev, Egypt flow).
 *     Post-launch track T3 swaps this to R2Storage when durable object
 *     storage is wired.
 */
export function getFileStorage(): FileStorage {
  if (!fileStorage) {
    if (process.env.STORAGE_ENABLED !== 'true') {
      fileStorage = new DisabledStorage();
      console.log('[composition] FileStorage: DisabledStorage (STORAGE_ENABLED != true)');
    } else {
      fileStorage = new LocalDiskStorage({
        uploadsDir: process.env.UPLOADS_DIR,
      });
      console.log('[composition] FileStorage: LocalDiskStorage');
    }
  }
  return fileStorage;
}

export function setFileStorage(storage: FileStorage): void {
  fileStorage = storage;
}
