# Login Schema Implementation

## Overview

The login system now supports **two separate login forms**:

1. **Email Login** - Login using email + password
2. **Mobile Login** - Login using country code + mobile number + password

## Schema Definition

### Login Schema (`src/types/auth.types.ts`)

```typescript
export const loginSchema = z
  .object({
    email: z.string().email().optional(),
    mobile: z
      .object({
        countryCode: z.string().min(1).max(4),
        mobileNumber: z.string().min(10).max(15),
      })
      .optional(),
    password: z.string().min(1),
  })
  .refine((data) => data.email || data.mobile, {
    message: "Either email or mobile number is required",
    path: ["email"],
  });
```

### Key Features:

- ✅ **Validation**: Ensures at least one login method is provided
- ✅ **Type-safe**: Full TypeScript type inference
- ✅ **Flexible**: Accepts either email OR mobile credentials

## API Usage Examples

### Email Login Request

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

### Mobile Login Request

```bash
POST /api/auth/login
Content-Type: application/json

{
  "mobile": {
    "countryCode": "+1",
    "mobileNumber": "1234567890"
  },
  "password": "yourpassword"
}
```

### Invalid Request (Missing Both)

```bash
POST /api/auth/login
Content-Type: application/json

{
  "password": "yourpassword"
}
```

**Response (400 Bad Request)**:

```json
{
  "success": false,
  "error": {
    "message": "Either email or mobile number is required",
    "type": "ValidationError"
  }
}
```

## Frontend Form Examples

### Email Login Form (React)

```tsx
const EmailLoginForm = () => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    // Handle response...
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={credentials.email}
        onChange={(e) =>
          setCredentials({ ...credentials, email: e.target.value })
        }
        placeholder="Email"
      />
      <input
        type="password"
        value={credentials.password}
        onChange={(e) =>
          setCredentials({ ...credentials, password: e.target.value })
        }
        placeholder="Password"
      />
      <button type="submit">Login with Email</button>
    </form>
  );
};
```

### Mobile Login Form (React)

```tsx
const MobileLoginForm = () => {
  const [credentials, setCredentials] = useState({
    mobile: {
      countryCode: "+1",
      mobileNumber: "",
    },
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    // Handle response...
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={credentials.mobile.countryCode}
        onChange={(e) =>
          setCredentials({
            ...credentials,
            mobile: { ...credentials.mobile, countryCode: e.target.value },
          })
        }
        placeholder="+1"
        maxLength={4}
      />
      <input
        type="tel"
        value={credentials.mobile.mobileNumber}
        onChange={(e) =>
          setCredentials({
            ...credentials,
            mobile: { ...credentials.mobile, mobileNumber: e.target.value },
          })
        }
        placeholder="Mobile Number"
        minLength={10}
        maxLength={15}
      />
      <input
        type="password"
        value={credentials.password}
        onChange={(e) =>
          setCredentials({ ...credentials, password: e.target.value })
        }
        placeholder="Password"
      />
      <button type="submit">Login with Mobile</button>
    </form>
  );
};
```

## Backend Implementation

The service automatically detects which login method was used and queries accordingly:

```typescript
async login(input: LoginInput) {
  let whereClause;

  if (input.email) {
    // Query by email
    whereClause = eq(users.email, input.email);
  } else if (input.mobile) {
    // Query by country code + mobile number (composite key)
    whereClause = and(
      eq(users.countryCode, input.mobile.countryCode),
      eq(users.mobileNumber, input.mobile.mobileNumber)
    );
  }

  // Find user and verify password...
}
```

## Validation Rules

### Email Login

- ✅ Must be valid email format
- ✅ Password required (min 1 character)

### Mobile Login

- ✅ Country code: 1-4 characters (e.g., "+1", "+91", "+44")
- ✅ Mobile number: 10-15 digits
- ✅ Password required (min 1 character)

### General

- ✅ At least one login method must be provided
- ✅ Cannot send both empty

## Error Handling

The system provides specific error messages based on the login method:

```typescript
// Email login error
{
  "success": false,
  "error": {
    "message": "Invalid credentials",
    "field": "email",
    "type": "ValidationError"
  }
}

// Mobile login error
{
  "success": false,
  "error": {
    "message": "Invalid credentials",
    "field": "mobile",
    "type": "ValidationError"
  }
}
```
