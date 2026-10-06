import { describe, expect, it, vi } from 'vitest';
import {
  ConflictError,
  DatabaseError,
  NotFoundError,
  ValidationError,
  errorHandler,
  handleDatabaseError,
} from './errors';

describe('database error handling', () => {
  it('wraps unexpected errors and non-error values', () => {
    expect(() => handleDatabaseError(new Error('disk failure'))).toThrow(
      'Database operation failed: disk failure',
    );
    expect(() => handleDatabaseError('disk failure')).toThrow(
      'Database operation failed: disk failure',
    );
  });

  it('maps SQLite constraint and busy errors to domain errors', () => {
    expect(() =>
      handleDatabaseError(new DatabaseError('UNIQUE constraint failed', 'SQLITE_CONSTRAINT')),
    ).toThrow(ConflictError);
    expect(() =>
      handleDatabaseError(new DatabaseError('FOREIGN KEY constraint failed', 'SQLITE_CONSTRAINT')),
    ).toThrow(ValidationError);
    expect(() =>
      handleDatabaseError(new DatabaseError('CHECK constraint failed', 'SQLITE_CONSTRAINT')),
    ).toThrow(ValidationError);
    expect(() =>
      handleDatabaseError(new DatabaseError('database is locked', 'SQLITE_BUSY')),
    ).toThrow('Database is temporarily unavailable');
  });

  it('maps missing-row errors and preserves domain errors', () => {
    expect(() =>
      handleDatabaseError(new DatabaseError('No rows affected', 'OTHER'), 'Supplier', 9),
    ).toThrow(NotFoundError);
    const error = new DatabaseError('already mapped');
    expect(() => handleDatabaseError(error)).toThrow(error);
  });

  it('returns database errors using their status and hides unexpected messages', () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    errorHandler(new ValidationError('bad input'), {} as never, res as never, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'VALIDATION_ERROR', message: 'Validation error: bad input' },
    });

    errorHandler(new Error('internal detail'), {} as never, res as never, next);
    expect(res.status).toHaveBeenLastCalledWith(500);
    expect(res.json).toHaveBeenLastCalledWith({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  });
});
