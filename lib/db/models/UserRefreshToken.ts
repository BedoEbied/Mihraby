import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '@/lib/db/connection';

export type RefreshTokenRow = {
  id: number;
  user_id: number;
  token_hash: string;
  family_id: string;
  expires_at: Date | string;
  revoked_at: Date | string | null;
  created_at: Date | string;
};

export class UserRefreshToken {
  static async findActiveByHash(tokenHash: string): Promise<RefreshTokenRow | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM user_refresh_tokens
       WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );
    if (rows.length === 0) return null;
    return rows[0] as unknown as RefreshTokenRow;
  }

  static async insert(params: {
    userId: number;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
  }): Promise<void> {
    await pool.query<ResultSetHeader>(
      `INSERT INTO user_refresh_tokens (user_id, token_hash, family_id, expires_at)
       VALUES (?, ?, ?, ?)`,
      [params.userId, params.tokenHash, params.familyId, params.expiresAt]
    );
  }

  static async revokeByHash(tokenHash: string): Promise<void> {
    await pool.query<ResultSetHeader>(
      `UPDATE user_refresh_tokens SET revoked_at = NOW()
       WHERE token_hash = ? AND revoked_at IS NULL`,
      [tokenHash]
    );
  }

  static async revokeFamily(familyId: string): Promise<void> {
    await pool.query<ResultSetHeader>(
      `UPDATE user_refresh_tokens SET revoked_at = NOW()
       WHERE family_id = ? AND revoked_at IS NULL`,
      [familyId]
    );
  }
}

