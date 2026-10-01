export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, code = "INTERNAL_ERROR", statusCode = 500, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", details?: unknown) {
    super(message, "UNAUTHORIZED", 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden: insufficient permissions", details?: unknown) {
    super(message, "FORBIDDEN", 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(entity = "Resource", id?: string) {
    super(`${entity}${id ? ` (${id})` : ""} not found`, "NOT_FOUND", 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

export class ConcurrencyError extends AppError {
  constructor(message = "Capacity or resource conflict occurred", details?: unknown) {
    super(message, "CONCURRENCY_CONFLICT", 409, details);
  }
}

export class StateTransitionError extends AppError {
  constructor(fromState: string, toState: string, reason?: string) {
    super(
      `Invalid state transition from ${fromState} to ${toState}${reason ? `: ${reason}` : ""}`,
      "INVALID_STATE_TRANSITION",
      400
    );
  }
}

export class LedgerImbalanceError extends AppError {
  constructor(message = "Ledger transaction is not balanced (debits != credits)", details?: unknown) {
    super(message, "LEDGER_IMBALANCE", 500, details);
  }
}
