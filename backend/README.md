# User API

## Endpoint: Create User

### **POST** `/users/register`

#### **Request Body (JSON)**

```json
{
  "user": {
    "username": "testuser",
    "email": "testuser@example.com",
    "password": "123456"
  }
}
```

#### **Response (JSON)**

```json
{
  "user": {
    "id": 1711742364893,
    "username": "testuser",
    "email": "testuser@example.com",
    "role": "user",
    "image": "default.png",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## Endpoint: User Login

### **POST** `/users/login`

#### **Request Body (JSON)**

```json
{
  "user": {
    "email": "testuser@example.com",
    "password": "123456"
  }
}
```

#### **Response (JSON)**

```json
{
  "user": {
    "id": 1711742364893,
    "username": "testuser",
    "email": "testuser@example.com",
    "role": "user",
    "image": "default.png",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## Endpoint: Get Current User

### **GET** `/user`

#### **Response (JSON)**

```json
{
  "user": {
    "id": 1711742364893,
    "username": "testuser",
    "email": "testuser@example.com",
    "role": "user",
    "image": "default.png",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Note:** This endpoint requires authentication and retrieves the current user based on the provided JWT token.

---

## Endpoint: Update Current User

### **PUT** `/user`

#### **Request Body (JSON)**

```json
{
  "user": {
    "username": "updatedUser",
    "email": "updateduser@example.com",
    "password": "newpassword",
    "image": "new-image-url.png",
    "role": "admin"
  }
}
```

#### **Response (JSON)**

```json
{
  "user": {
    "id": 1711742364893,
    "username": "updatedUser",
    "email": "updateduser@example.com",
    "role": "admin",
    "image": "new-image-url.png",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Note:** This endpoint requires authentication and allows updating the current user's profile information.

---

## Endpoint: Get User by ID

### **GET** `/users/:id`

#### **Response (JSON)**

```json
{
  "user": {
    "id": 1711742364893,
    "username": "testuser",
    "email": "testuser@example.com",
    "role": "user",
    "image": "default.png",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### **Validation Rules**

- `username` (string) - **optional**, must not exceed 30 characters.
- `email` (string) - **optional**, must be a valid email address.
- `password` (string) - **optional**, must be at least **6 characters** long.
- `role` (enum: `user`, `admin`, `superadmin`) - **optional**.
- `image` (string) - **optional**.

**Note:** The `password` field is **never** returned in the response for security reasons.

### **Database Requirements**

- `id` (integer) - Automatically generated.
- `token` (string) - Contains the JWT token for authentication.

### **Authentication**

- Authentication **not required** for user registration.
- Authentication **required** for user login.
- Authenticated requests must include the `Authorization` header with a valid JWT token:
  ```http
  Authorization: Bearer <token>
  ```
- The system automatically decodes the JWT and attaches the user object to the request.
- Authentication **required** for retrieving the current user via `GET /user`.
- Authentication **required** for updating the current user via `PUT /user`.
- Access to protected routes is enforced using an **AuthGuard**, which ensures that `request.user` is present before granting access. If `request.user` is missing, a `401 Unauthorized` error is returned.

### **Status Codes**

- `201 Created` - Successful registration.
- `200 OK` - Successful operation.
- `400 Bad Request` - Invalid or missing input.
- `401 Unauthorized` - Authentication required.
- `422 Unprocessable Entity` - Email or username already exists.
- `404 Not Found` - User not found.

---

## File Upload System

### **Upload Directory Structure**

The backend stores uploaded files in the following structure:

```
backend/uploads/
  teams/          # Team logos
  users/          # User profile images
  championships/  # Championship images
```

**Note:** The `/uploads` directory is excluded from version control (in `.gitignore`). Only the directory structure with `.gitkeep` files is versioned.

### **File Upload Endpoints**

See `API.md` for detailed documentation of upload endpoints:
- `POST /upload/team-logo`
- `POST /upload/user-image`
- `POST /upload/championship-image`

### **Upload Specifications**

- **Allowed formats:** JPG, PNG, WebP
- **Maximum file size:** 2MB
- **File naming:** UUID-based for uniqueness
- **Validation:** Server-side validation of MIME type and file size

### **Static File Serving**

Uploaded files are served statically via `/uploads/*` path, configured in `main.ts`.

---

### **Next Steps**

- **Database Integration:** Store the user in PostgreSQL.
- **Password Hashing:** Ensure passwords are not stored in plaintext.
- **JWT Generation:** Generate a token after successful registration and login.
- **User Retrieval:** Implement GET `/users/:id` to fetch user details.
