# HealthSync — Backend API

> Unified Medical Records Platform for India

A production-quality authentication backend for a healthcare application. Built with Express 5, MongoDB, and JWT-based authentication with enterprise-grade security features.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18.x
- **MongoDB** (local or Atlas)
- **npm** ≥ 9.x

### Setup

```bash
# 1. Clone and navigate
cd Backend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# 4. Start development server
npm run dev

# 5. Start production server
npm start
```

---

## 📁 Project Structure

```
Backend/
├── src/
│   ├── config/             # Configuration (DB, JWT, cookies, env validation)
│   ├── constants/          # Enum-like constants (roles, messages)
│   ├── controllers/        # Thin request handlers (delegate to services)
│   ├── middleware/         # Express middleware (auth, security, rate limit, errors, requestId)
│   ├── models/             # Mongoose schemas (User, Hospital, RefreshToken, AuditLog)
│   ├── routes/             # Route definitions with middleware chains
│   ├── services/           # Core business logic (auth, token, email, audit)
│   ├── utils/              # Utility classes (ApiError, ApiResponse, async handler, logger)
│   ├── validators/         # express-validator chains per endpoint
│   ├── app.js              # Express app configuration and middleware order
│   └── server.js           # Server entry point with graceful shutdown
├── tests/                  # Integration tests (Jest & Supertest)
├── .env.example            # Environment variable template
├── .gitignore
├── nodemon.json
├── package.json
└── README.md
```

---

## 🔐 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint                     | Auth Required | Rate Limit         | Description                   |
|--------|------------------------------|---------------|--------------------|------------------------------ |
| POST   | `/api/auth/register`         | ❌            | 3 req / 1 hour     | Register a new user           |
| POST   | `/api/auth/register/hospital`| ❌            | 3 req / 1 hour     | Register a new hospital       |
| POST   | `/api/auth/login`            | ❌            | 5 req / 15 min     | Login and get tokens          |
| POST   | `/api/auth/logout`           | ✅            | General            | Logout and clear cookie       |
| POST   | `/api/auth/logout/all`       | ✅            | General            | Logout from all sessions      |
| POST   | `/api/auth/refresh`          | ❌ (cookie)   | General            | Refresh access token          |
| GET    | `/api/auth/me`               | ✅            | General            | Get current user profile      |
| POST   | `/api/auth/verify-email`     | ❌            | 5 req / 1 hour     | Verify email using token      |
| POST   | `/api/auth/resend-verification`| ❌          | 5 req / 1 hour     | Resend verification email     |
| POST   | `/api/auth/forgot-password`  | ❌            | 3 req / 1 hour     | Request password reset link   |
| POST   | `/api/auth/reset-password`   | ❌            | 3 req / 1 hour     | Reset password using token    |
| POST   | `/api/auth/change-password`  | ✅            | 5 req / 15 min     | Change password               |

### Request/Response Examples

#### Register
```json
POST /api/auth/register
{
  "firstName": "Rahul",
  "lastName": "Sharma",
  "email": "rahul@example.com",
  "mobileNumber": "9876543210",
  "password": "SecureP@ss1!"
}

Response (201):
{
  "success": true,
  "statusCode": 201,
  "message": "Registration successful.",
  "data": {
    "_id": "...",
    "fullName": { "firstName": "Rahul", "lastName": "Sharma" },
    "email": "rahul@example.com",
    "mobileNumber": "9876543210",
    "role": "user",
    "isVerified": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### Login
```json
POST /api/auth/login
{
  "email": "rahul@example.com",
  "password": "SecureP@ss1!"
}

Response (200):
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful.",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbG..."
  }
}
// Refresh token set as HttpOnly cookie
```

#### Error Response
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    { "field": "email", "message": "Please provide a valid email address." },
    { "field": "password", "message": "Password must contain at least one uppercase letter." }
  ]
}
```

---

## 🔒 Security Features (21 Implemented)

| #  | Feature                     | Status |
|----|---------------------------- |--------|
| 1  | JWT Access Token (15 min)   | ✅     |
| 2  | JWT Refresh Token (7 days)  | ✅     |
| 3  | Refresh Token Rotation      | ✅     |
| 4  | Hashed Refresh Tokens (SHA-256) | ✅  |
| 5  | bcrypt Password Hashing (12 rounds) | ✅ |
| 6  | Secure HttpOnly Cookies     | ✅     |
| 7  | Rate Limiting (per-route)   | ✅     |
| 8  | Account Lockout (5 attempts → 15 min) | ✅ |
| 9  | Email Verification          | ✅     |
| 10 | Forgot/Reset Password       | ✅     |
| 11 | Request Validation (express-validator) | ✅ |
| 12 | Helmet (HTTP headers)       | ✅     |
| 13 | Mongo Sanitization          | ✅     |
| 14 | HPP Protection              | ✅     |
| 15 | XSS Sanitization            | ✅     |
| 16 | CORS (origin-restricted)    | ✅     |
| 17 | Environment Validation      | ✅     |
| 18 | Centralized Config          | ✅     |
| 19 | Global Error Handler        | ✅     |
| 20 | Async Error Wrapper         | ✅     |
| 21 | Audit Logging               | ✅     |

---

## ⚙️ Environment Variables

| Variable               | Required | Description                          |
|------------------------|----------|--------------------------------------|
| `PORT`                 | Yes      | Server port (default: 5000)          |
| `NODE_ENV`             | Yes      | `development`, `production` or `test`|
| `MONGO_URI`            | Yes      | MongoDB connection string            |
| `MONGO_URI_TEST`       | Yes (Test)| Test MongoDB connection string       |
| `ACCESS_TOKEN_SECRET`  | Yes      | JWT secret (min 64 chars)            |
| `REFRESH_TOKEN_SECRET` | Yes      | Refresh token secret (min 64 chars)  |
| `CLIENT_URL`           | Yes      | Frontend URL for CORS                |
| `SMTP_HOST`            | No       | SMTP host for email sending          |
| `SMTP_PORT`            | No       | SMTP port                            |
| `SMTP_USER`            | No       | SMTP username                        |
| `SMTP_PASS`            | No       | SMTP password                        |
| `SMTP_FROM`            | No       | Sender email address                 |

---

## 🏗️ Architecture

### Middleware Order (as configured in `app.js`)

```
1. requestId        → Unique tracking ID for request logs
2. cors()           → Origin-restricted CORS
3. applySecurity()  → Helmet, HPP, XSS, Mongo Sanitization
4. morgan()         → Request logging (via Winston stream)
5. compression()    → Response compression
6. express.json()   → Body parser
7. cookieParser()   → Parse cookies
8. generalLimiter  → 100 req / 15 min
9. routes          → API route handlers
10. notFound        → 404 handler
11. errorHandler    → Global error handler
```

---

## 📜 License

ISC
