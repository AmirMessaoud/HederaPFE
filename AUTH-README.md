# Authentication API Documentation

## Overview

This document outlines the authentication system for the Hedera API platform. The authentication system uses JSON Web Tokens (JWT) to secure API endpoints and manage user sessions.

## Authentication Flow

1. **Registration**: New users register by providing personal information and credentials
2. **Login**: Existing users authenticate with email and password to receive a JWT token
3. **Protected Access**: JWT token is included in subsequent requests to access protected resources
4. **Token Expiration**: Tokens expire after 3 days, requiring users to login again

## Base URL

All authentication API requests should be prefixed with: `http://localhost:5000/api/auth`

## Endpoints

### Register a New User

Creates a new user account and returns a JWT token for immediate authentication.

- **URL**: `/signup`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+1234567890",
    "password": "StrongP@ssw0rd"
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid input data
    ```json
    {
      "error": "Email already in use"
    }
    ```
    ```json
    {
      "error": "Password not strong enough"
    }
    ```
    ```json
    {
      "error": "All fields must be filled"
    }
    ```

### Login User

Authenticates a user and returns a JWT token for subsequent requests.

- **URL**: `/login`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "email": "john.doe@example.com",
    "password": "StrongP@ssw0rd"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid credentials
    ```json
    {
      "error": "Incorrect email"
    }
    ```
    ```json
    {
      "error": "Incorrect password"
    }
    ```
    ```json
    {
      "error": "All fields must be filled"
    }
    ```

### Get User Profile

Returns the currently authenticated user's profile information.

- **URL**: `/profile`
- **Method**: `GET`
- **Headers**:
  ```
  Authorization: Bearer YOUR_JWT_TOKEN
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "_id": "60d21b4667d0d8992e610c85",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+1234567890",
    "createdAt": "2025-04-22T11:05:22.123Z",
    "updatedAt": "2025-04-22T11:05:22.123Z"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Missing or invalid token
    ```json
    {
      "error": "Authorization token required"
    }
    ```
    ```json
    {
      "error": "Request is not authorized"
    }
    ```
  - `404 Not Found`: User not found
    ```json
    {
      "error": "User not found"
    }
    ```

### Change Password

Allows authenticated users to change their password securely.

- **URL**: `/change-password`
- **Method**: `POST`
- **Headers**:
  ```
  Authorization: Bearer YOUR_JWT_TOKEN
  ```
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "currentPassword": "OldP@ssw0rd",
    "newPassword": "NewStr0ngP@ssw0rd"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Password updated successfully"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid request
    ```json
    {
      "error": "Current password and new password are required"
    }
    ```
    ```json
    {
      "error": "New password must be different from current password"
    }
    ```
    ```json
    {
      "error": "Current password is incorrect"
    }
    ```
    ```json
    {
      "error": "New password not strong enough. It should contain at least 8 characters, including uppercase, lowercase, numbers, and symbols"
    }
    ```
  - `401 Unauthorized`: Missing or invalid token
    ```json
    {
      "error": "Authorization token required"
    }
    ```
  - `404 Not Found`: User not found
    ```json
    {
      "error": "User not found"
    }
    ```
  - `500 Internal Server Error`: Server error
    ```json
    {
      "error": "Error message details"
    }
    ```

## Using Authentication Tokens

### Token Format

The JWT token is returned in the following format:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MGQyMWI0NjY3ZDBkODk5MmU2MTBjODUiLCJpYXQiOjE2MTk4NzE2ODAsImV4cCI6MTYyMDEzMDg4MH0.X3hM5hY5jlPFKEQpRZ9QemgT0Tr3HJW-U0s6rDEOGvI
```

### Including Tokens in Requests

For all protected endpoints (all `/api/identity/*` routes), include the JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Token Expiration

Tokens are valid for 3 days after issuance. After expiration, users must log in again to get a new token.

## Password Requirements

Strong passwords must meet the following criteria:

- Minimum length of 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- At least one special character

## Error Handling

All error responses follow this format:

```json
{
  "error": "Detailed error message"
}
```

Common HTTP status codes:

- `200`: Successful request
- `201`: Resource created successfully
- `400`: Bad request (validation error, invalid data)
- `401`: Unauthorized (missing or invalid token)
- `404`: Resource not found
- `500`: Server error

## Environment Configuration

The authentication system requires the following environment variable:

```
JWT_SECRET=your_secret_key_for_jwt_signing
```

If not provided, a default secret key will be used, but this is not recommended for production environments.

## Security Best Practices

1. Store tokens securely on the client side (e.g., HttpOnly cookies or secure local storage)
2. Always use HTTPS in production environments
3. Do not include sensitive information in JWT payloads
4. Implement token refresh mechanisms for long-running applications
5. Use strong, unique passwords for user accounts
