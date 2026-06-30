# Create First Admin

Use this curl command to create your first admin account:

```bash
curl -X POST http://localhost:3001/api/admin/create \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: YOUR_ADMIN_SECRET_TOKEN_HERE" \
  -d '{
    "name": "Admin Name",
    "email": "admin@example.com",
    "password": "your-secure-password",
    "role": "SUPER_ADMIN"
  }'
```

## Steps:

1. Make sure you have `ADMIN_SECRET_TOKEN` set in your `.env` file
2. Replace `YOUR_ADMIN_SECRET_TOKEN_HERE` with the actual token from your `.env`
3. Replace the name, email, and password with your desired values
4. Run the curl command
5. You can now login at http://localhost:3001/login with your email and password

## Environment Variables Needed:

Add to your `.env` file:

```
ADMIN_SECRET_TOKEN=your-super-secret-token-here
JWT_SECRET=your-jwt-secret-here
```

## Note:

- This route is protected and can only be called with the correct `x-admin-secret` header
- Use it to create the first admin, then you can create more admins from the dashboard
- Once logged in as admin, all admin buttons will appear automatically
