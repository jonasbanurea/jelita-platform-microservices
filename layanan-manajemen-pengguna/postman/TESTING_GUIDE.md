# Testing Guide for User & Auth Service with Postman

## Table of Contents
1. [Preparation](#preparation)
2. [Import Collection & Environment](#import-collection--environment)
3. [Environment Configuration](#environment-configuration)
4. [Running Tests](#running-tests)
5. [Troubleshooting](#troubleshooting)

---

## Preparation

### 1. Install Postman
- Download and install Postman from [postman.com/downloads](https://www.postman.com/downloads/)
- Or use Postman Web (login at [postman.com](https://www.postman.com))

### 2. Ensure Service is Running
Before testing, ensure layanan-manajemen-pengguna is running:

```powershell
cd d:\KULIAH\TESIS\prototype_eng\layanan-manajemen-pengguna
npm install
node server.js
```

Or if using nodemon:
```powershell
npm run dev
```

Ensure the following message appears:
```
User & Auth Service is running on port 3005
```

### 3. Prepare Database
Ensure the database is configured and has at least 1 user for testing. The `.env` file must be filled:

```
PORT=3005
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=nama_database
JWT_SECRET=your_generated_jwt_secret_here
```

---

## Import Collection & Environment

### Method 1: Import via File

1. **Open Postman**
2. **Import Collection:**
   - Click **Import** button at top left
   - Select **File** tab
   - Browse to: `d:\KULIAH\TESIS\prototype_eng\layanan-manajemen-pengguna\postman\User_Auth_Service.postman_collection.json`
   - Click **Import**
   
3. **Import Environment:**
   - Click **Import** button again
   - Browse to: `d:\KULIAH\TESIS\prototype_eng\layanan-manajemen-pengguna\postman\User_Auth_Service.postman_environment.json`
   - Click **Import**

### Method 2: Drag & Drop

Simply drag and drop both JSON files into the Postman window.

---

## Environment Configuration

### Activate Environment

1. Click **Environment** dropdown at top right (usually shows "No Environment")
2. Select **User Auth Service - Development**

### Adjust Variables (if needed)

Click the eye icon (👁️) next to environment dropdown to view/edit variables:

| Variable | Default Value | Description |
|----------|---------------|------------|
| `BASE_URL` | `http://localhost:3005` | Service URL (adjust PORT if different) |
| `TOKEN` | (empty) | Will be auto-filled after signin |
| `AUTH_HEADER` | (empty) | Will be auto-filled after signin |
| `USER_ID` | `1` | User ID for testing role endpoint |

If your service runs on a different port, edit `BASE_URL` as needed.

---

## Running Tests

### Recommended Testing Workflow

```
1. Sign In (get token)
   ↓
2. Validate Token (check token is valid)
   ↓
3. Get User Role & Permissions (access protected endpoint)
```

---

### 1. **POST /api/auth/signin** - Sign In

**Purpose:** Login and get JWT token

#### Steps:
1. Open collection **User & Auth Service - Layanan Manajemen Pengguna**
2. Open folder **Authentication**
3. Click request **Sign In**
4. In **Body** tab, adjust username and password with existing user in database:
   ```json
   {
       "username": "demo",
       "password": "demo123"
   }
   ```
5. Click **Send**

#### Expected Response (200 OK):
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFkbWluIiwiaWF0IjoxNjk5..."
}
```

#### What Happens Automatically:
- Token saved to environment variable `TOKEN`
- Variable `AUTH_HEADER` filled with format `Bearer <token>`
- You can see in **Tests** tab → **Console** (Ctrl+Alt+C)

#### If Failed:
- **404 User not found** → Username doesn't exist in database
- **401 Invalid credentials** → Wrong password
- **500 Internal server error** → Check database connection or server logs

---

### 2. **GET /api/auth/validate** - Validate Token

**Purpose:** Validate JWT token obtained from signin

#### Steps:
1. Click request **Validate Token**
2. Ensure in **Headers** tab there is:
   - Key: `Authorization`
   - Value: `{{AUTH_HEADER}}` (automatically fetched from environment)
3. Click **Send**

#### Expected Response (200 OK):
```json
{
    "valid": true,
    "user": {
        "id": 1,
        "role": "Admin"
    }
}
```

#### Automated Tests:
Collection already includes automated tests that will:
- ✅ Ensure status code 200
- ✅ Ensure token is valid
- ✅ Ensure user has id and role

View test results in **Test Results** tab after sending request.

#### If Failed:
- **401 No token provided** → Token not sent (ensure signin first)
- **401 Invalid or expired token** → Token expired (signin again) or JWT_SECRET different

---

### 3. **GET /api/users/:id/peran** - Get User Role & Permissions

**Purpose:** Get user role and permissions (protected endpoint)

#### Steps:
1. Open folder **Users**
2. Click request **Get User Role & Permissions**
3. In **Params** tab, adjust path variable `:id`:
   - Key: `id`
   - Value: `1` (or other user ID to check)
4. Ensure in **Headers** tab there is:
   - Key: `Authorization`
   - Value: `{{AUTH_HEADER}}`
5. Click **Send**

#### Expected Response (200 OK):
```json
{
    "id": 1,
    "username": "demo",
    "role": "Admin",
    "access": [
        "manage_users",
        "view_reports",
        "manage_system"
    ]
}
```

#### Access Rights by Role:

| Role | Access Permissions |
|------|-------------------|
| **Pemohon** | `create_permohonan`, `view_own_status` |
| **Admin** | `manage_users`, `view_reports`, `manage_system` |
| **OPD** | `review_permohonan`, `comment` |
| **Pimpinan** | `approve_permohonan`, `view_reports` |

#### Automated Tests:
- ✅ Status code 200
- ✅ Response has id, username, role, access
- ✅ Role is one of valid enum
- ✅ Access is an array

#### If Failed:
- **401 No token provided** → Signin first to get token
- **404 User not found** → User with that ID doesn't exist in database
- **500 Internal server error** → Check database connection

---

## Complete Testing Scenarios

### Scenario 1: Happy Path (Success Flow)
```
1. POST /api/auth/signin
   Body: { "username": "demo", "password": "demo123" }
   Expected: 200 OK, get token
   
2. GET /api/auth/validate
   Header: Authorization: Bearer <token>
   Expected: 200 OK, { "valid": true, "user": {...} }
   
3. GET /api/users/1/peran
   Header: Authorization: Bearer <token>
   Expected: 200 OK, { "id": 1, "role": "...", "access": [...] }
```

### Scenario 2: Unauthorized Access (No Token)
```
1. GET /api/auth/validate
   (tanpa Authorization header)
   Expected: 401 Unauthorized, "No token provided"
   
2. GET /api/users/1/peran
   (tanpa Authorization header)
   Expected: 401 Unauthorized
```

### Skenario 3: Invalid Credentials
```
1. POST /api/auth/signin
   Body: { "username": "demo", "password": "wrongpassword" }
   Expected: 401 Unauthorized, "Invalid credentials"
   
2. POST /api/auth/signin
   Body: { "username": "nonexistent", "password": "password" }
   Expected: 404 Not Found, "User not found"
```

### Skenario 4: Expired Token
```
1. Tunggu token expire (default: 1 jam)
2. GET /api/auth/validate
   Header: Authorization: Bearer <expired_token>
   Expected: 401 Unauthorized, "Invalid or expired token"
```

---

## Advanced: Run Collection with Runner

To run all requests at once:

1. Right-click on collection **User & Auth Service**
2. Select **Run collection**
3. Ensure all requests are checked
4. Click **Run User & Auth Service**
5. View test summary

**Note:** Requests must be run in sequence (Sign In first) so token is available for subsequent requests.

---

## Advanced: Pre-request Script for Automation

If you want to auto-login before protected endpoint requests, add Pre-request Script:

```javascript
// Pre-request Script for endpoints that need auth
const BASE_URL = pm.environment.get("BASE_URL");
const TOKEN = pm.environment.get("TOKEN");

// If token doesn't exist yet, do automatic signin
if (!TOKEN) {
    pm.sendRequest({
        url: BASE_URL + '/api/auth/signin',
        method: 'POST',
        header: {
            'Content-Type': 'application/json'
        },
        body: {
            mode: 'raw',
            raw: JSON.stringify({
                username: 'demo',
                password: 'demo123'
            })
        }
    }, function (err, res) {
        if (!err && res.code === 200) {
            const jsonData = res.json();
            pm.environment.set("TOKEN", jsonData.token);
            pm.environment.set("AUTH_HEADER", "Bearer " + jsonData.token);
        }
    });
}
```

---

## Troubleshooting

### Problem: "Could not get response" / Connection refused
**Solution:**
- Ensure service is running (check terminal)
- Check PORT in environment variable matches service PORT
- Ensure no firewall is blocking

### Problem: "Invalid or expired token"
**Solution:**
- Re-run Sign In request to get new token
- Token expires in 1 hour by default (can be changed in JWT sign options)
- Ensure JWT_SECRET in .env matches the one used during signin

### Problem: "User not found" during Sign In
**Solution:**
- Create test user in database first
- Or run seeder/migration if available
- Check username in request body matches database data

### Problem: Environment variable not auto-filling
**Solution:**
- Ensure environment is selected (check top-right dropdown)
- Open **Tests** tab in Sign In request, ensure script exists
- Open Console (Ctrl+Alt+C) to view error logs

### Problem: Database connection error
**Solution:**
- Check `.env` file is filled correctly
- Ensure MySQL/database service is running
- Test database connection manually
- Check DB_USER and DB_PASSWORD credentials

---

## Tips & Best Practices

1. **Use Environment for different stages:**
   - Duplicate environment for Development, Staging, Production
   - Adjust BASE_URL for each

2. **Save response examples:**
   - After successful test, click **Save Response** → **Save as Example**
   - Useful for documentation and team sharing

3. **Use Collection Variables for sensitive data:**
   - Don't commit environment file with credentials to git
   - Use `.gitignore` for `*.postman_environment.json`

4. **Monitor via Console:**
   - Open Console (View → Show Postman Console or Ctrl+Alt+C)
   - View request/response details and script logs

5. **Export Collection for sharing:**
   - Click ... on collection → Export
   - Share JSON file with team (without environment credentials)

---

## Referensi Endpoint

| Method | Endpoint | Auth Required | Deskripsi |
|--------|----------|---------------|-----------|
| POST | `/api/auth/signin` | ❌ | Login dan dapatkan JWT token |
| GET | `/api/auth/validate` | ✅ | Validasi JWT token |
| GET | `/api/users/:id/peran` | ✅ | Dapatkan role dan permissions user |

---

## Next Steps

After successfully testing User & Auth Service, you can:
1. Add signup endpoint (POST /api/auth/signup)
2. Implement refresh token mechanism
3. Add endpoint for updating user role
4. Implement audit log for signin activity
5. Test integration with other microservices

---

**Note:** This documentation assumes the service runs on `http://localhost:3005`. Adjust PORT if different.

**Last Updated:** November 11, 2025
