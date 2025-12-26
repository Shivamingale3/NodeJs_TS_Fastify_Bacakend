import { ZodError, ZodIssue } from "zod";

/**
 * Custom validation error class for better error handling
 */
export class ValidationError extends Error {
  public statusCode: number = 400;
  public errors: ValidationErrorDetail[];

  constructor(message: string, errors: ValidationErrorDetail[]) {
    super(message);
    this.name = "ValidationError";
    this.errors = errors;
  }
}

/**
 * Validation error detail structure
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  code?: string;
}

/**
 * Format Zod errors into structured validation errors
 */
export function formatZodError(zodError: ZodError): ValidationErrorDetail[] {
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
  const message = `Validation failed: ${errors
    .map((e) => `${e.field} - ${e.message}`)
    .join(", ")}`;
  return new ValidationError(message, errors);
}

/**
 * Throw a validation error (useful for service layer)
 */
export function throwValidationError(field: string, message: string): never {
  throw new ValidationError(`Validation failed: ${field} - ${message}`, [
    { field, message },
  ]);
}

/**
 * Create custom validation errors for business logic
 */
export function createCustomValidationError(
  errors: Array<{ field: string; message: string }>
): ValidationError {
  const message = `Validation failed: ${errors
    .map((e) => `${e.field} - ${e.message}`)
    .join(", ")}`;
  return new ValidationError(message, errors);
}
