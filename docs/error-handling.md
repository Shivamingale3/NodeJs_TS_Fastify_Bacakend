# Database Error Handling

## Overview

The backend now has a comprehensive human-readable error handling system for PostgreSQL/Drizzle errors.

## What Was Fixed

### 1. Schema Mismatch Issue

**Problem**: You renamed `phoneNumberVerified` to `mobileNumberVerified` in the database schema, but the code still used the old field name.

**Fixed in**:

- ✅ `/src/services/auth.service.ts` - Updated to use `mobileNumberVerified`
- ✅ `/src/types/user.types.ts` - Updated UserType interface

### 2. Human-Readable Error Messages

**Created**: `/src/utils/db-error-handler.ts`

This utility converts PostgreSQL errors like:

```
error: column "phone_number_verified" does not exist
```

Into human-readable messages like:

```json
{
  "success": false,
  "error": {
    "message": "Database schema mismatch: Column 'phone_number_verified' is missing. Please run migrations.",
    "field": "phone_number_verified",
    "type": "DatabaseError"
  }
}
```

### 3. Global Error Handler

**Updated**: `/src/app.ts`

The app now has a comprehensive error handler that automatically:

- Detects database errors (Drizzle/PostgreSQL)
- Converts them to human-readable messages
- Returns appropriate HTTP status codes
- Sanitizes error messages in production

## Common PostgreSQL Error Codes Now Handled

| Code  | Original Error        | Human-Readable Message                    |
| ----- | --------------------- | ----------------------------------------- |
| 23505 | unique_violation      | "A record with this value already exists" |
| 23503 | foreign_key_violation | "Related record not found"                |
| 23502 | not_null_violation    | "Required field is missing"               |
| 42703 | undefined_column      | "Database column not found"               |
| 42P01 | undefined_table       | "Database table not found"                |
| 42710 | duplicate_object      | "Database object already exists"          |

## Next Steps

### Run Database Migrations

You had a migration error because the `role` enum already exists. To fix this:

**Option 1: Push schema directly (recommended for development)**

```bash
npx drizzle-kit push
```

**Option 2: Generate and apply migrations**

```bash
# Generate migrations
npx drizzle-kit generate

# Check the generated SQL files in drizzle/ folder
# Remove any CREATE TYPE statements if the type already exists

# Then apply
npx drizzle-kit migrate
```

**Option 3: Clean slate (if safe to drop data)**

```bash
# Drop the database and recreate
docker compose down -v
docker compose up -d

# Then push schema
npx drizzle-kit push
```

## Usage Examples

### In Controllers (automatically handled)

```typescript
// Just throw errors - the global handler will convert them
async register(request: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await this.authService.register(request.body);
    return reply.send(result);
  } catch (error) {
    throw error; // Global handler will make it human-readable!
  }
}
```

### Manual Usage

```typescript
import { getHumanReadableDbError } from "../utils/db-error-handler";

try {
  await db.insert(users).values(userData);
} catch (error) {
  const { message, field } = getHumanReadableDbError(error);
  console.log(message); // "Database schema mismatch: Column 'phone_number_verified' is missing..."
}
```

## Testing

Try making a request that would cause a database error:

```bash
# This should now return a nice error message instead of raw PostgreSQL
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"userName": "test", "password": "test123", "fullName": "Test User"}'
```
