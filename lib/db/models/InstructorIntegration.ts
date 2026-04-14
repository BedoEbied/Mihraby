import type { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import pool from '@/lib/db/connection';
import type { IInstructorIntegration, IntegrationProvider } from '@/types';
import { encrypt, decrypt } from '@/lib/crypto';

/**
 * Instructor third-party integrations (Zoom OAuth in MVP).
 *
 * access_token and refresh_token are stored ENCRYPTED at rest. The `get*` and
 * `getDecryptedTokens` helpers transparently decrypt on read; the `upsert`
 * helper encrypts on write. Never write plaintext tokens to the underlying
 * table — use this class exclusively.
 */

type RunnerLike = Pick<PoolConnection, 'query'> | typeof pool;

function runner(conn?: PoolConnection): RunnerLike {
  return conn ?? pool;
}

export interface UpsertIntegrationInput {
  instructor_id: number;
  provider: IntegrationProvider;
  access_token: string;
  refresh_token: string;
  expires_at: Date;
  provider_user_id?: string | null;
}

export interface DecryptedTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export class InstructorIntegration {
  /**
   * Returns the stored integration (with tokens still encrypted) or null.
   * For the decrypted tokens, use getDecryptedTokens().
   */
  static async findByInstructorAndProvider(
    instructorId: number,
    provider: IntegrationProvider,
    conn?: PoolConnection
  ): Promise<IInstructorIntegration | null> {
    const [rows] = await runner(conn).query<RowDataPacket[]>(
      'SELECT * FROM instructor_integrations WHERE instructor_id = ? AND provider = ?',
      [instructorId, provider]
    );
    return (rows[0] as IInstructorIntegration | undefined) ?? null;
  }

  /**
   * Lock the integration row and return decrypted tokens inside a transaction.
   * Used during access-token refresh to serialize concurrent refreshes — Zoom
   * rotates refresh tokens, so two concurrent refreshes would otherwise lose
   * access.
   */
  static async lockForRefresh(
    conn: PoolConnection,
    instructorId: number,
    provider: IntegrationProvider
  ): Promise<DecryptedTokens | null> {
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT access_token, refresh_token, expires_at
       FROM instructor_integrations
       WHERE instructor_id = ? AND provider = ?
       FOR UPDATE`,
      [instructorId, provider]
    );
    const row = rows[0] as
      | { access_token: string; refresh_token: string; expires_at: Date }
      | undefined;
    if (!row) return null;
    return {
      accessToken: decrypt(row.access_token),
      refreshToken: decrypt(row.refresh_token),
      expiresAt: new Date(row.expires_at)
    };
  }

  /**
   * Insert-or-update an integration. Tokens are encrypted here.
   */
  static async upsert(input: UpsertIntegrationInput, conn?: PoolConnection): Promise<void> {
    const encryptedAccess = encrypt(input.access_token);
    const encryptedRefresh = encrypt(input.refresh_token);
    await runner(conn).query<ResultSetHeader>(
      `INSERT INTO instructor_integrations
        (instructor_id, provider, access_token, refresh_token, expires_at, provider_user_id)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        access_token = VALUES(access_token),
        refresh_token = VALUES(refresh_token),
        expires_at = VALUES(expires_at),
        provider_user_id = VALUES(provider_user_id),
        updated_at = CURRENT_TIMESTAMP`,
      [
        input.instructor_id,
        input.provider,
        encryptedAccess,
        encryptedRefresh,
        input.expires_at,
        input.provider_user_id ?? null
      ]
    );
  }

  /**
   * Update only the tokens + expiry (used by refresh flow). Keeps the original
   * provider_user_id and timestamps intact apart from updated_at.
   */
  static async updateTokens(
    conn: PoolConnection,
    instructorId: number,
    provider: IntegrationProvider,
    tokens: DecryptedTokens
  ): Promise<void> {
    await conn.query<ResultSetHeader>(
      `UPDATE instructor_integrations
       SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
       WHERE instructor_id = ? AND provider = ?`,
      [
        encrypt(tokens.accessToken),
        encrypt(tokens.refreshToken),
        tokens.expiresAt,
        instructorId,
        provider
      ]
    );
  }

  static async delete(
    instructorId: number,
    provider: IntegrationProvider
  ): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM instructor_integrations WHERE instructor_id = ? AND provider = ?',
      [instructorId, provider]
    );
    return result.affectedRows > 0;
  }

  /**
   * Decrypt the tokens for a stored integration row. Used for read-only Zoom
   * API calls that don't need a transactional refresh path.
   */
  static async getDecryptedTokens(
    instructorId: number,
    provider: IntegrationProvider
  ): Promise<DecryptedTokens | null> {
    const row = await InstructorIntegration.findByInstructorAndProvider(instructorId, provider);
    if (!row) return null;
    return {
      accessToken: decrypt(row.access_token),
      refreshToken: decrypt(row.refresh_token),
      expiresAt: new Date(row.expires_at)
    };
  }
}

export default InstructorIntegration;
