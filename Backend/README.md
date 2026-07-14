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
│   ├── constants/          # Enum-like constants (roles, token types, messages)
│   ├── controllers/        # Thin request handlers (delegate to services)
│   ├── helpers/            # Convenience wrappers (email, password, audit)
│   ├── middleware/         # Express middleware (auth, security, rate limit, errors)
│   ├── models/             # Mongoose schemas (User, RefreshToken, AuditLog)
│   ├── routes/             # Route definitions with middleware chains
│   ├── services/           # Core business logic (auth, token, email, audit)
│   ├── utils/              # Utility classes (ApiError, ApiResponse, async handler)
│   ├── validators/         # express-validator chains per endpoint
│   ├── app.js              # Express app configuration and middleware order
│   └── server.js           # Server entry point with graceful shutdown
├── tests/                  # Test placeholders (jest/mocha)
├── .env.example            # Environment variable template
├── .gitignore
├── nodemon.json
├── package.json
└── README.md
```

---

## 🔐 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint                    | Auth Required | Rate Limit         | Description                   |
|--------|-----------------------------|---------------|--------------------|------------------------------ |
| POST   | `/api/auth/register`        | ❌            | 3 req / 1 hour     | Register a new user           |
| POST   | `/api/auth/login`           | ❌            | 5 req / 15 min     | Login and get tokens          |
| POST   | `/api/auth/logout`          | ✅            | General             | Logout and clear tokens       |
| POST   | `/api/auth/refresh`         | ❌ (cookie)   | General             | Refresh access token          |
| GET    | `/api/auth/me`              | ✅            | General             | Get current user profile      |
| GET    | `/api/auth/verify-email/:token` | ❌        | General             | Verify email address          |
| POST   | `/api/auth/forgot-password` | ❌            | 5 req / 15 min     | Request password reset        |
| POST   | `/api/auth/reset-password/:token` | ❌      | General             | Reset password with token     |

### Request/Response Examples

#### Register
```json
POST /api/auth/register
{
  "firstName": "Rahul",
  "lastName": "Sharma",
  "email": "rahul@example.com",
  "mobileNumber": "9876543210",
  "password": "SecureP@ss1"
}

Response (201):
{
  "success": true,
  "statusCode": 201,
  "message": "Registration successful. Please verify your email.",
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
  "password": "SecureP@ss1"
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
| 4  | Hashed Refresh Tokens (bcrypt) | ✅  |
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
| `NODE_ENV`             | Yes      | `development` or `production`        |
| `MONGO_URI`            | Yes      | MongoDB connection string            |
| `ACCESS_TOKEN_SECRET`  | Yes      | JWT secret (min 64 chars)            |
| `REFRESH_TOKEN_SECRET` | Yes      | Refresh token secret (min 64 chars)  |
| `CLIENT_URL`           | Yes      | Frontend URL for CORS                |
| `EMAIL_HOST`           | Prod     | SMTP host                            |
| `EMAIL_PORT`           | Prod     | SMTP port                            |
| `EMAIL_USER`           | Prod     | SMTP username                        |
| `EMAIL_PASS`           | Prod     | SMTP password                        |
| `EMAIL_FROM`           | No       | Sender name and email                |

---

## 🏗️ Architecture

### Middleware Order (as configured in `app.js`)

```
1. helmet()         → Secure HTTP headers
2. cors()           → Origin-restricted CORS
3. morgan()         → Request logging (dev only)
4. compression()    → Response compression
5. express.json()   → Body parser
6. cookieParser()   → Parse cookies
7. mongoSanitize()  → Block NoSQL injection
8. hpp()            → Prevent parameter pollution
9. xss()            → Strip XSS payloads
10. generalLimiter  → 100 req / 15 min
11. routes          → API route handlers
12. notFound        → 404 handler
13. errorHandler    → Global error handler
```

### Authentication Flow

```
Register → Validate → Hash Password → Save → Send Verification Email

Login → Validate → Check Lockout → bcrypt.compare() → Check Verified
     → Reset Attempts → Generate Access Token → Generate Refresh Token
     → Hash & Store Refresh Token → Set Cookie → Return User

Refresh → Read Cookie → bcrypt.compare(token, hash) → Delete Old Token
       → Generate New Refresh Token → Hash & Store → Set Cookie
       → Generate New Access Token → Return

Logout → Delete All Refresh Tokens → Clear Cookie
```

---

## 📜 License

ISC
