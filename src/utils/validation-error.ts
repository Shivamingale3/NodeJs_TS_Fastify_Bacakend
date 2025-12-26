import { ZodError, ZodIssue } from "zod";
import {
  ErrorDetail,
  createValidationErrorResponse,
} from "../types/error.types";

/**
 * Custom validation error class for better error handling
 */
export class ValidationError extends Error {
  public statusCode: number = 422;
  public errors: ErrorDetail[];

  constructor(message: string, errors: ErrorDetail[]) {
    super(message);
    this.name = "ValidationError";
    this.errors = errors;
  }
}

/**
 * Format Zod errors into structured validation errors
 */
export function formatZodError(zodError: ZodError): ErrorDetail[] {
  return zodError.issues.map((issue: ZodIssue) => ({
    field: issue.path.join(".") || "root",
    message: issue.message,
    code: issue.code,
  }));
}

/**
 * Create a validation error from Zod error
 */
export function createValidationError(zodError: ZodError): ValidationError {
  const errors = formatZodError(zodError);
  const message = errors.length === 1 ? errors[0].message : "Validation failed";
  return new ValidationError(message, errors);
}

/**
 * Throw a validation error (useful for service layer)
 */
export function throwValidationError(field: string, message: string): never {
  throw new ValidationError(message, [{ field, message }]);
}

/**
 * Create custom validation errors for business logic
 */
export function createCustomValidationError(
  errors: Array<{ field: string; message: string }>
): ValidationError {
  const message = errors.length === 1 ? errors[0].message : "Validation failed";
  return new ValidationError(message, errors);
}
