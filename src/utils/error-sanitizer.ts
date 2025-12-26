/**
 * Sanitize error stack traces by removing file paths
 * This prevents exposing internal file structure in production
 */
export function sanitizeStackTrace(stack?: string): string | undefined {
  if (!stack) return undefined;

  // Remove absolute file paths, keeping only function names and relative info
  return stack
    .split("\n")
    .map((line) => {
      // Remove file paths like /home/user/project/file.ts:line:column
      // Keep only the function name and location info without full paths
      return line
        .replace(/\(\/[^)]+\)/g, "(...)") // Remove paths in parentheses
        .replace(/at \/[^\s]+/g, "at <hidden>") // Remove paths after "at"
        .replace(/file:\/\/\/[^\s]+/g, "<hidden>"); // Remove file:// URIs
    })
    .join("\n");
}

/**
 * Sanitize error object for safe client response
 */
export function sanitizeError(error: Error, includeStack: boolean = false) {
  const sanitized: {
    message: string;
    stack?: string;
  } = {
    message: error.message,
  };

  if (includeStack && error.stack) {
    sanitized.stack = sanitizeStackTrace(error.stack);
  }

  return sanitized;
}
