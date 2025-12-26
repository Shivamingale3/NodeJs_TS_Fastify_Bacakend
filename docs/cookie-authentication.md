# HTTP-Only Cookie Authentication

## Implementation Complete ✅

JWT tokens are now securely stored in HTTP-only cookies instead of being returned in the response body.

## Changes Made

### 1. Installed Dependencies

```bash
npm install @fastify/cookie @types/cookie
```

### 2. Updated Files

#### [`app.ts`](file:///home/leadows/Projects/practice/backend/src/app.ts)

- Registered `@fastify/cookie` plugin with JWT secret

#### [`plugins/auth-guard.ts`](file:///home/leadows/Projects/practice/backend/src/plugins/auth-guard.ts)

- Updated JWT plugin configuration to read from cookies:

```typescript
app.register(fjwt, {
  secret: env.JWT_SECRET,
  cookie: {
    cookieName: "token",
    signed: false,
  },
});
```

#### [`services/auth.service.ts`](file:///home/leadows/Projects/practice/backend/src/services/auth.service.ts)

- Modified `login()` to return full response with user data and token
- Token included in response for cookie setting

#### [`controllers/auth.controller.ts`](file:///home/leadows/Projects/practice/backend/src/controllers/auth.controller.ts)

- **Login**: Sets token as HTTP-only cookie

  - HttpOnly: `true` (prevents JavaScript access)
  - Secure: `true` in production (HTTPS only)
  - SameSite: `strict` (CSRF protection)
  - Path: `/`
  - MaxAge: 7 days

- **Logout**: Added new endpoint to clear the cookie

#### [`routes/auth.routes.ts`](file:///home/leadows/Projects/practice/backend/src/routes/auth.routes.ts)

- Added `POST /logout` route

## API Usage

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "YourPassword@123"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "fullName": "User Name",
      "role": "USER"
    }
  }
}
```

**Cookie Set** (HTTP-only, not visible in response):

```
Set-Cookie: token=<JWT_TOKEN>; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800
```

### Accessing Protected Routes

The token is automatically sent with requests:

```bash
GET /api/users/me
# Cookie: token=<JWT_TOKEN> (automatically included by browser)
```

### Logout

```bash
POST /api/auth/logout
# Cookie will be sent automatically
```

**Response**:

```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

**Cookie Cleared**:

```
Set-Cookie: token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

## Security Benefits

✅ **XSS Protection**: JavaScript cannot access the token  
✅ **CSRF Protection**: SameSite=Strict prevents cross-site requests  
✅ **HTTPS Only**: Secure flag ensures transmission over HTTPS in production  
✅ **Long Expiry**: 7-day sessions for better UX  
✅ **Automatic Transmission**: Browser handles cookie management

## Frontend Integration

### Using `fetch` with credentials

```javascript
// Login
const response = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include", // Important: includes cookies
  body: JSON.stringify({ email, password }),
});

// Protected requests
const userResponse = await fetch("/api/users/me", {
  credentials: "include", // Automatically sends token cookie
});

// Logout
await fetch("/api/auth/logout", {
  method: "POST",
  credentials: "include",
});
```

### Using `axios`

```javascript
import axios from "axios";

// Configure axios to include credentials
axios.defaults.withCredentials = true;

// Login
await axios.post("/api/auth/login", { email, password });

// Protected requests (cookie sent automatically)
const { data } = await axios.get("/api/users/me");

// Logout
await axios.post("/api/auth/logout");
```

## Token Still Works in Authorization Header

For mobile apps or API clients that can't use cookies:

```bash
GET /api/users/me
Authorization: Bearer <JWT_TOKEN>
```

The JWT plugin checks both:

1. Cookie (preferred for web browsers)
2. Authorization header (fallback for API clients)
