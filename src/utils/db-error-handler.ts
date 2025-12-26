import { createDatabaseErrorResponse } from "../types/error.types";

/**
 * Database error codes and their human-readable messages
 */
const DB_ERROR_MESSAGES: Record<string, string> = {
  "23505": "A record with this value already exists", // unique_violation
  "23503": "Related record not found", // foreign_key_violation
  "23502": "Required field is missing", // not_null_violation
  "23514": "Invalid data format", // check_violation
  "42P01": "Database table not found", // undefined_table
  "42703": "Database column not found", // undefined_column
  "42710": "Database object already exists", // duplicate_object
  "42804": "Data type mismatch", // datatype_mismatch
  "22P02": "Invalid input format", // invalid_text_representation
  "22003": "Value is out of range", // numeric_value_out_of_range
  "23000": "Data integrity violation", // integrity_constraint_violation
};

/**
 * Extract the column name from constraint name
 */
function extractColumnFromConstraint(constraint: string): string | null {
  // Common patterns: users_email_unique, users_email_key, etc.
  const match = constraint.match(/_([a-z_]+)_(unique|key|idx)/i);
  return match ? match[1].replace(/_/g, " ") : null;
}

/**
 * Convert PostgreSQL error to human-readable message with standardized format
 */
export function getHumanReadableDbError(error: any): {
  message: string;
  field?: string;
  code?: string;
} {
  // Handle Drizzle query errors
  if (error.message?.includes("Failed query")) {
    // Extract the actual PostgreSQL error from the cause
    const causeMessage = error.cause?.message || error.message;

    // Column doesn't exist
    if (
      causeMessage.includes("column") &&
      causeMessage.includes("does not exist")
    ) {
      const columnMatch = causeMessage.match(/column "([^"]+)"/);
      return {
        message: `Database schema mismatch: Column '${
          columnMatch?.[1] || "unknown"
        }' is missing. Please run migrations.`,
        field: columnMatch?.[1],
        code: "42703",
      };
    }

    // Table doesn't exist
    if (
      causeMessage.includes("relation") &&
      causeMessage.includes("does not exist")
    ) {
      const tableMatch = causeMessage.match(/relation "([^"]+)"/);
      return {
        message: `Database table '${
          tableMatch?.[1] || "unknown"
        }' not found. Please run migrations.`,
        code: "42P01",
      };
    }

    // Type already exists (enum duplicate)
    if (
      causeMessage.includes("type") &&
      causeMessage.includes("already exists")
    ) {
      const typeMatch = causeMessage.match(/type "([^"]+)"/);
      return {
        message: `Database type '${
          typeMatch?.[1] || "unknown"
        }' already exists. Schema is up to date or needs manual cleanup.`,
        code: "42710",
      };
    }
  }

  // Handle PostgreSQL error codes
  if (error.code) {
    const baseMessage =
      DB_ERROR_MESSAGES[error.code] || "Database operation failed";

    // Add specific context based on error type
    if (error.code === "23505" && error.constraint) {
      const column = extractColumnFromConstraint(error.constraint);
      return {
        message: column ? `${column} already exists` : baseMessage,
        field: column || error.constraint,
        code: error.code,
      };
    }

    if (error.code === "23503" && error.constraint) {
      return {
        message: `${baseMessage}. Please ensure all related data exists.`,
        field: error.constraint,
        code: error.code,
      };
    }

    return {
      message: baseMessage,
      code: error.code,
    };
  }

  // Fallback for unknown errors
  return {
    message: "An unexpected database error occurred",
  };
}
