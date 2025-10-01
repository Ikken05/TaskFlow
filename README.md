# TaskFlow - User Management System

A full-stack user authentication and management system with meaningful names for each feature.

📋 **[Project Description & Objectives](https://www.notion.so/TaskFlow-Project-Description-Objectives-26fe34632bc781468f6be5b286537c92?source=copy_link)**

## Project Structure

```
├── backend/          # Node.js/Express API server
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── Models/
│   │   ├── routes/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
├── frontend/         # React TypeScript UI
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── hooks/
│   └── package.json
└── README.md
```

## Features

### Authentication Pages (Meaningful Names)

1. **Sign In Page** (`/signin`) - "Welcome Back"
   - Sign in to existing account
   - Link to password reset and account creation

2. **Create Account Page** (`/create-account`) - "Join TaskFlow"
   - Register new user account
   - Automatic email verification trigger

3. **Forgot Password Page** (`/forgot-password`) - "Reset Your Password"
   - Request password reset instructions
   - Email-based password recovery

4. **Verify Email Page** (`/verify-email`) - "Email Verification"
   - Verify email address with token
   - Resend verification email option

5. **Dashboard Page** (`/dashboard`) - "TaskFlow Dashboard"
   - User profile information
   - Account status and verification status

## Setup Instructions

### Backend Setup

1. Navigate to backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env`:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   EMAIL_HOST=your_email_host
   EMAIL_PORT=587
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_password
   ```

4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup

1. Navigate to frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## API Endpoints

- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Sign in to account
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/resend-verification` - Resend verification email
- `GET /api/auth/profile` - Get current user profile

## User Experience

Each page has a clear, meaningful name that describes its purpose:
- **Sign In**: For returning users
- **Create Account**: For new users joining
- **Forgot Password**: For password recovery
- **Verify Email**: For email confirmation
- **Dashboard**: For authenticated user workspace