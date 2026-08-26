export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class HttpException extends AppError {
  constructor(
    public readonly status: number,
    code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message, code);
  }
}

export class ValidationError extends HttpException {
  constructor(message = "Invalid input", details?: unknown) {
    super(400, "VALIDATION_ERROR", message, details);
  }
}

export class UnauthorisedError extends HttpException {
  constructor(message = "Authentication required") {
    super(401, "UNAUTHORISED", message);
  }
}

export class ForbiddenError extends HttpException {
  constructor(message = "Not allowed") {
    super(403, "FORBIDDEN", message);
  }
}

export class NotFoundError extends HttpException {
  constructor(message = "Resource not found") {
    super(404, "NOT_FOUND", message);
  }
}

export class ConflictError extends HttpException {
  constructor(message = "Conflict with current state", details?: unknown) {
    super(409, "CONFLICT", message, details);
  }
}

export class RateLimitError extends HttpException {
  constructor(
    public readonly retryAfterSeconds: number,
    message = "Too many changes at once — please wait a few seconds",
  ) {
    super(429, "RATE_LIMITED", message);
  }
}
