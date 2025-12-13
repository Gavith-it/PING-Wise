# Postman Testing Guide for CRM API

## Base URL
```
https://pw-crm-gateway-1.onrender.com
```

## Test Credentials
- **Username**: `aprameya@pingwise.in`
- **Password**: `PingWise!@2025`

---

## Step 1: Login (Get JWT Token)

### Request Setup:
1. **Method**: `POST`
2. **URL**: `https://pw-crm-gateway-1.onrender.com/login`
3. **Headers**:
   ```
   Content-Type: application/json
   ```
4. **Body** (raw JSON):
   ```json
   {
     "user_name": "aprameya@pingwise.in",
     "password": "PingWise!@2025"
   }
   ```

### Expected Response (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2025-01-XX...",
  "role": "admin"
}
```

### ⚠️ IMPORTANT:
- **Copy the `access_token` value** from the response
- You'll need this token for all other API requests
- Save it in a Postman variable for easy reuse

---

## Step 2: Set Up Postman Variables (Recommended)

1. In Postman, click on **"Variables"** tab (or press `Ctrl+Alt+V`)
2. Create a variable:
   - **Variable Name**: `crm_token`
   - **Initial Value**: (leave empty, will be set automatically)
   - **Current Value**: (leave empty)
3. Or manually copy the token from login response

---

## Step 3: Test Get Customers (Fetch Data)

### Request Setup:
1. **Method**: `GET`
2. **URL**: `https://pw-crm-gateway-1.onrender.com/customers`
3. **Headers**:
   ```
   Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
   Content-Type: application/json
   ```
   
   Replace `YOUR_ACCESS_TOKEN_HERE` with the token from Step 1.

   **OR** if you set up variables:
   ```
   Authorization: Bearer {{crm_token}}
   ```

### Expected Response (200 OK):
```json
[
  {
    "id": "123",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address": "123 Main St",
    "age": 30,
    "gender": "male",
    "assigned_to": "doctor_id",
    "status": "active",
    "medical_history": {},
    "created_at": "2025-01-XX...",
    "updated_at": "2025-01-XX..."
  }
]
```

### Possible Responses:
- **200 OK**: Success! Returns array of customers (may be empty `[]`)
- **401 Unauthorized**: Token expired or invalid → Login again
- **500 Server Error**: API server issue

---

## Step 4: Test CheckAuth (Validate Token)

### Request Setup:
1. **Method**: `POST`
2. **URL**: `https://pw-crm-gateway-1.onrender.com/checkAuth`
3. **Headers**:
   ```
   Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
   Content-Type: application/json
   ```
4. **Body**: (empty or no body needed)

### Expected Response (200 OK):
```json
"valid"  // or similar success message
```

---

## Step 5: Create a Customer (Test POST)

### Request Setup:
1. **Method**: `POST`
2. **URL**: `https://pw-crm-gateway-1.onrender.com/customers`
3. **Headers**:
   ```
   Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
   Content-Type: application/json
   ```
4. **Body** (raw JSON):
   ```json
   {
     "first_name": "Jane",
     "last_name": "Smith",
     "email": "jane@example.com",
     "phone": "+9876543210",
     "address": "456 Oak Ave",
     "age": 25,
     "gender": "female",
     "status": "active"
   }
   ```

### Expected Response (200 OK):
```json
{
  "id": "456",
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com",
  ...
  "created_at": "2025-01-XX...",
  "updated_at": "2025-01-XX..."
}
```

---

## Quick Postman Collection Setup

### Option 1: Manual Setup
1. Create a new Collection: "CRM API Tests"
2. Add requests for each endpoint
3. Set collection-level variable: `base_url = https://pw-crm-gateway-1.onrender.com`
4. Use `{{base_url}}/login`, `{{base_url}}/customers`, etc.

### Option 2: Auto-Update Token (Using Tests)
Add this script in the **Tests** tab of the Login request:

```javascript
// Save token to variable automatically
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.access_token) {
        pm.environment.set("crm_token", response.access_token);
        console.log("Token saved:", response.access_token);
    }
}
```

Then use `{{crm_token}}` in Authorization header for other requests.

---

## Common Issues & Solutions

### Issue 1: 401 Unauthorized
**Cause**: Invalid or expired token
**Solution**: 
- Login again to get a new token
- Make sure Authorization header format is: `Bearer TOKEN` (with space after "Bearer")

### Issue 2: CORS Error
**Cause**: Browser blocking cross-origin requests
**Solution**: 
- Use Postman (no CORS issues)
- Or use the Next.js proxy route: `/api/crm/customers` (when testing from browser)

### Issue 3: Empty Array `[]`
**Cause**: No customers in database yet
**Solution**: 
- This is normal! Create a customer using POST request
- Then GET customers again to see the data

### Issue 4: Connection Timeout
**Cause**: Server might be slow or down
**Solution**: 
- Wait a moment and try again (Render.com free tier may have cold starts)
- Check if base URL is correct

---

## Testing Checklist

- [ ] Login endpoint returns access_token
- [ ] Token is saved/copied correctly
- [ ] GET /customers returns 200 OK (even if empty array)
- [ ] Authorization header is correctly formatted
- [ ] POST /customers creates new customer
- [ ] GET /customers shows newly created customer
- [ ] checkAuth validates token correctly

---

## Quick Test URLs (Copy-Paste Ready)

```
POST https://pw-crm-gateway-1.onrender.com/login
GET  https://pw-crm-gateway-1.onrender.com/customers
POST https://pw-crm-gateway-1.onrender.com/checkAuth
POST https://pw-crm-gateway-1.onrender.com/customers
GET  https://pw-crm-gateway-1.onrender.com/customers/{id}
PUT  https://pw-crm-gateway-1.onrender.com/customers/{id}
DELETE https://pw-crm-gateway-1.onrender.com/customers/{id}
```

---

## Debugging Tips

1. **Check Response Status**: Green 200 = Success, Red 4xx/5xx = Error
2. **Check Response Body**: Look for error messages
3. **Check Headers**: Make sure Authorization header is set
4. **Use Console**: Postman Console (bottom left) shows full request/response
5. **Test Token**: Use checkAuth endpoint to verify token is valid

---

## Video Walkthrough Steps:

1. Open Postman
2. Create new request → POST → `https://pw-crm-gateway-1.onrender.com/login`
3. Go to Body → raw → JSON
4. Paste login JSON
5. Click Send
6. Copy the `access_token` from response
7. Create new request → GET → `https://pw-crm-gateway-1.onrender.com/customers`
8. Go to Headers tab
9. Add: `Authorization: Bearer YOUR_TOKEN`
10. Click Send
11. Check response - should see customers array (may be empty)

---

**Need Help?** Check Postman Console for detailed error messages!

