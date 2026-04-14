import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import type { ApiResponse } from '@/types';

export enum ApiErrorCode {
  AUTH_FAILED = 'AUTH_FAILED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  FORBIDDEN = 'FORBIDDEN',
  SERVER_ERROR = 'SERVER_ERROR',
}

export class ApiError extends Error {
  statusCode: number;
  code: ApiErrorCode;

  constructor(message: string, statusCode = 500, code: ApiErrorCode = ApiErrorCode.SERVER_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function handleApiError(error: unknown, requestId?: string) {
  if (error instanceof ApiError) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: error.message, error: error.code },
      {
        status: error.statusCode,
        headers: requestId ? { 'x-request-id': requestId } : undefined,
      }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: 'Validation failed',
        error: `${ApiErrorCode.VALIDATION_ERROR}: ${error.issues.map((i) => i.message).join(', ')}`,
      },
      {
        status: 400,
        headers: requestId ? { 'x-request-id': requestId } : undefined,
      }
    );
  }

  const message = error instanceof Error ? error.message : 'Internal server error';
  return NextResponse.json<ApiResponse>(
    { success: false, message, error: ApiErrorCode.SERVER_ERROR },
    {
      status: 500,
      headers: requestId ? { 'x-request-id': requestId } : undefined,
    }
  );
}
