# Quick Postman Test - Get Customers

## Step 1: Test GET /customers with Your Token

### Request Setup:
1. **Method**: `GET`
2. **URL**: `https://pw-crm-gateway-1.onrender.com/customers`
3. **Headers Tab**:
   - Click on "Headers" tab
   - Add a new header:
     - **Key**: `Authorization`
     - **Value**: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjkzYmRmZTQ0OTEwMGM1NmY0Njg1ZTk3Iiwib3JnX2lkIjoiIiwicm9sZSI6InVzZXIiLCJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiaXNzIjoicGluZy13aXNlIiwic3ViIjoiNjkzYmRmZTQ0OTEwMGM1NmY0Njg1ZTk3IiwiZXhwIjoxNzY1NTYwOTgzLCJuYmYiOjE3NjU1NjAwODMsImlhdCI6MTc2NTU2MDA4M30.UQgq1AY_eilF3PxE58dpmlrwKXuq35J8M0lFqpcz4ZE`
   - Make sure there's a space after "Bearer"

4. **Click "Send"**

### Expected Responses:

#### ✅ Success (200 OK):
```json
[]
```
If you see an empty array `[]`, it means:
- ✅ Token is valid
- ✅ API is working
- ✅ No customers exist yet (this is normal!)

OR if customers exist:
```json
[
  {
    "id": "123",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    ...
  }
]
```

#### ❌ Error (401 Unauthorized):
```json
{
  "error": "Unauthorized"
}
```
This means the token expired or is invalid. Login again to get a new token.

#### ❌ Error (500):
Server error - API might be down or having issues.

---

## Step 2: Create a Test Customer (Optional)

If GET returned empty array `[]`, try creating a customer:

1. **Method**: `POST`
2. **URL**: `https://pw-crm-gateway-1.onrender.com/customers`
3. **Headers**:
   - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (same token)
   - `Content-Type`: `application/json`
4. **Body** (raw JSON):
```json
{
  "first_name": "Test",
  "last_name": "User",
  "email": "test@example.com",
  "phone": "+1234567890",
  "age": 30,
  "gender": "male",
  "status": "active"
}
```

5. **Click "Send"**

### Expected Response:
```json
{
  "id": "xxx",
  "first_name": "Test",
  "last_name": "User",
  ...
}
```

---

## Step 3: Get Customers Again

After creating a customer, run GET /customers again. You should now see the customer in the array!

---

## ⚠️ Important Notes:

1. **Token Expiry**: Your token expires at `2025-12-12T17:36:23Z`. If it expires, login again.
2. **Save Token**: In Postman, you can save the token as an environment variable:
   - Create/Edit Environment → Add variable `crm_token` → Paste token
   - Use `{{crm_token}}` in Authorization header
3. **Security**: Don't share tokens publicly. This token is for testing only.

---

## Quick Copy-Paste:

### GET Request:
```
URL: https://pw-crm-gateway-1.onrender.com/customers
Method: GET
Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjkzYmRmZTQ0OTEwMGM1NmY0Njg1ZTk3Iiwib3JnX2lkIjoiIiwicm9sZSI6InVzZXIiLCJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiaXNzIjoicGluZy13aXNlIiwic3ViIjoiNjkzYmRmZTQ0OTEwMGM1NmY0Njg1ZTk3IiwiZXhwIjoxNzY1NTYwOTgzLCJuYmYiOjE3NjU1NjAwODMsImlhdCI6MTc2NTU2MDA4M30.UQgq1AY_eilF3PxE58dpmlrwKXuq35J8M0lFqpcz4ZE
```

---

## What to Check:

1. ✅ **If GET returns `[]`**: API is working! No customers yet - create one with POST.
2. ✅ **If GET returns array with customers**: Perfect! API is working and returning data.
3. ❌ **If GET returns `401`**: Token expired - login again.
4. ❌ **If GET returns `null`**: API might return null for empty data - our app handles this now.

After testing, let me know what response you get!

