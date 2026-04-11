import type { IInstructorIntegration, IntegrationProvider } from '@/types';

/**
 * Abstraction over a video meeting provider (Zoom, Google Meet, Jitsi, ...).
 *
 * Concrete implementations:
 *   - ZoomProvider (Phase 5) — active for MVP
 *
 * To add another provider, implement this interface and register it in
 * `lib/composition.ts`.
 */
export interface MeetingProvider {
  readonly name: IntegrationProvider;

  /**
   * Build the provider's OAuth authorize URL for an instructor. The caller
   * is responsible for redirecting the instructor's browser to the returned URL.
   *
   * @param state Opaque, signed state parameter the callback will verify.
   */
  getAuthorizeUrl(state: string): string;

  /**
   * Exchange an OAuth `code` for access + refresh tokens, then persist them
   * (encrypted) to `instructor_integrations`. Returns the stored integration.
   */
  exchangeCode(instructorId: number, code: string): Promise<IInstructorIntegration>;

  /**
   * Return a valid access token for the instructor, refreshing if expired.
   * The refresh path MUST be serialized to avoid losing rotating refresh tokens —
   * see ZoomProvider.getAccessToken for the pattern.
   */
  getAccessToken(instructorId: number): Promise<string>;

  /**
   * Create a meeting for a confirmed booking. Called AFTER the booking-status
   * transaction has committed, so a failure here does not roll back payment.
   * On error, the caller inserts a row into `booking_meeting_retries`.
   */
  createMeetingForBooking(bookingId: number): Promise<CreatedMeeting>;

  /**
   * Delete a meeting. Called on cancellation. Implementations must tolerate
   * 404 (already deleted) — log and resolve, don't throw.
   */
  deleteMeeting(instructorId: number, meetingId: string): Promise<void>;
}

export interface CreatedMeeting {
  meetingId: string;
  joinUrl: string;
  /**
   * Instructor-only start URL (where applicable). Not sent to students.
   */
  startUrl?: string;
}

/**
 * Thrown when an instructor has not connected the provider and we attempt to
 * create a meeting on their behalf. Upstream callers should block publish
 * rather than hit this at booking time.
 */
export class MeetingProviderNotConnectedError extends Error {
  constructor(public readonly instructorId: number, public readonly provider: IntegrationProvider) {
    super(`Instructor ${instructorId} has not connected ${provider}`);
    this.name = 'MeetingProviderNotConnectedError';
  }
}
