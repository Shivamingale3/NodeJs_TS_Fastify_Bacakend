/**
 * Centralized error type definitions for consistent API error responses
 */

/**
 * Standard error types used across the API
 */
export enum ErrorType {
  VALIDATION_ERROR = "ValidationError",
  DATABASE_ERROR = "DatabaseError",
  AUTHENTICATION_ERROR = "AuthenticationError",
  AUTHORIZATION_ERROR = "AuthorizationError",
  NOT_FOUND_ERROR = "NotFoundError",
  SERVER_ERROR = "ServerError",
}

/**
 * Individual error detail (for validation/field-specific errors)
 */
export interface ErrorDetail {
  field: string;
  message: string;
  code?: string;
}

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    type: ErrorType;
    message: string;
    errors?: ErrorDetail[];
    metadata?: Record<string, any>;
  };
  timestamp: string;
}

/**
 * Standard API success response structure
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  message?: string;
  data: T;
  timestamp?: string;
}

/**
 * Helper function to create standardized error response
 */
export function createErrorResponse(
  type: ErrorType,
  message: string,
  errors?: ErrorDetail[],
  metadata?: Record<string, any>
): ApiErrorResponse {
  return {
    success: false,
    error: {
      type,
      message,
      ...(errors && errors.length > 0 && { errors }),
      ...(metadata && { metadata }),
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Helper function to create validation error response
 */
export function createValidationErrorResponse(
  message: string,
  errors: ErrorDetail[]
): ApiErrorResponse {
  return createErrorResponse(ErrorType.VALIDATION_ERROR, message, errors);
}

/**
 * Helper function to create single field validation error
 */
export function createFieldErrorResponse(
  field: string,
  message: string
): ApiErrorResponse {
  return createValidationErrorResponse(message, [{ field, message }]);
}

/**
 * Helper function to create database error response
 */
export function createDatabaseErrorResponse(
  message: string,
  field?: string
): ApiErrorResponse {
  const errors = field ? [{ field, message }] : undefined;
  return createErrorResponse(ErrorType.DATABASE_ERROR, message, errors);
}

/**
 * Helper function to create authentication error response
 */
export function createAuthErrorResponse(message: string): ApiErrorResponse {
  return createErrorResponse(ErrorType.AUTHENTICATION_ERROR, message);
}

/**
 * Helper function to create authorization error response
 */
export function createAuthzErrorResponse(message: string): ApiErrorResponse {
  return createErrorResponse(ErrorType.AUTHORIZATION_ERROR, message);
}

/**
 * Helper function to create not found error response
 */
export function createNotFoundErrorResponse(
  message: string = "Resource not found"
): ApiErrorResponse {
  return createErrorResponse(ErrorType.NOT_FOUND_ERROR, message);
}

/**
 * Helper function to create server error response
 */
export function createServerErrorResponse(
  message: string = "An unexpected error occurred",
  metadata?: Record<string, any>
): ApiErrorResponse {
  return createErrorResponse(
    ErrorType.SERVER_ERROR,
    message,
    undefined,
    metadata
  );
}
