import crypto from 'crypto';
import { UserRefreshToken } from '@/lib/db/models/UserRefreshToken';
import { ApiError, ApiErrorCode } from '@/lib/api/errors';

function sha256Hex(input: string) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

export class RefreshTokenService {
  static createOpaqueToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static async issue(userId: number, familyId: string, ttlMs: number): Promise<string> {
    const token = this.createOpaqueToken();
    const tokenHash = sha256Hex(token);
    const expiresAt = new Date(Date.now() + ttlMs);
    await UserRefreshToken.insert({ userId, tokenHash, familyId, expiresAt });
    return token;
  }

  static async rotate(currentToken: string, ttlMs: number): Promise<{ userId: number; familyId: string; newToken: string }> {
    const tokenHash = sha256Hex(currentToken);
    const row = await UserRefreshToken.findActiveByHash(tokenHash);
    if (!row) {
      throw new ApiError('Invalid refresh token', 401, ApiErrorCode.AUTH_FAILED);
    }

    // Single-use rotation: revoke current token, issue a new one in same family.
    await UserRefreshToken.revokeByHash(tokenHash);
    const newToken = await this.issue(row.user_id, row.family_id, ttlMs);
    return { userId: row.user_id, familyId: row.family_id, newToken };
  }

  static async revokeFamily(familyId: string): Promise<void> {
    await UserRefreshToken.revokeFamily(familyId);
  }
}

