# Admin Dashboard Guide

## Overview
The Admin Dashboard provides powerful tools for managing the CornLeaf AI system, including user management, model training, data management, and system monitoring.

## Accessing the Admin Dashboard

### Default Admin Credentials
After running the database seed, you can login with these default admin credentials:

- **Email:** `admin@cornleaf.app`
- **Password:** `admin123`

⚠️ **Important:** Change the default password immediately after first login!

### Running the Database Seed
```bash
cd backend
npm run seed
```

Or using Prisma directly:
```bash
cd backend
npx prisma db seed
```

## Admin Dashboard Features

### 1. **Dashboard Overview**
Upon logging in as an admin, you'll be automatically redirected to the Admin Dashboard which shows:

- **System Statistics:**
  - Total Users
  - Total Detections
  - Model Accuracy
  - Community Posts

- **Visual Analytics:**
  - Disease Distribution Chart
  - Weekly Activity Trends
  - Real-time activity feed

### 2. **Quick Actions Panel**
Access important features directly from the dashboard:

- **Train Model:** Improve AI accuracy with new training data
- **Manage Data:** View and manage the training dataset
- **User Management:** Control user accounts and permissions
- **System Settings:** Configure system parameters

### 3. **Recent Activity Monitor**
Track all system activities including:
- Disease detections
- User registrations
- Community posts
- Model training sessions

### 4. **User Management** (`/admin/users`)
- View all registered users
- Update user roles (USER ↔ ADMIN)
- View role change history
- Delete user accounts

### 5. **Model Training** (`/admin/training`)
- Start new training sessions
- Monitor training progress
- View training history
- Adjust model parameters

### 6. **Data Management** (`/admin/data`)
- Upload new training images
- Organize dataset
- View data statistics
- Export training data

## Creating Additional Admin Users

### Method 1: Using the Admin Dashboard
1. Login as an existing admin
2. Navigate to **User Management**
3. Find the user you want to promote
4. Click "Change Role" and select "ADMIN"

### Method 2: Using the Backend API
Make a PUT request to update user role:
```bash
curl -X PUT http://localhost:8000/api/admin/users/{userId}/role \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "ADMIN"}'
```

### Method 3: Direct Database Update
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'user@example.com';
```

## Admin Navigation

The sidebar includes an **Admin Panel** section visible only to admin users with links to:
- Admin Dashboard
- Model Training
- Data Management
- Settings

## Security Best Practices

1. **Change Default Password:**
   - Go to Settings → Change Password
   - Use a strong, unique password

2. **Limit Admin Access:**
   - Only grant admin role to trusted users
   - Regularly review admin user list

3. **Monitor Admin Actions:**
   - Check role change history regularly
   - Review recent activity logs

4. **Secure Your Environment:**
   - Keep `JWT_SECRET` secure in production
   - Use HTTPS in production
   - Enable rate limiting

## Troubleshooting

### "Admin access required" Error
- Ensure you're logged in with an admin account
- Check that user role is set to 'ADMIN' (uppercase)
- Clear browser cache and re-login

### Can't See Admin Dashboard
- Verify the user role in the database: `SELECT * FROM "User" WHERE role = 'ADMIN';`
- Check that ProtectedRoute component is properly configured
- Ensure backend middleware is working: Check `requireAdmin` middleware

### Admin Routes Not Working
- Verify backend server is running on port 8000
- Check API base URL in frontend: `REACT_APP_API_URL`
- Inspect browser console for errors

## API Endpoints (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Get system statistics |
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/users/:userId` | Get specific user |
| PUT | `/api/admin/users/:userId/role` | Update user role |
| GET | `/api/admin/users/:userId/role-history` | View role changes |
| DELETE | `/api/admin/users/:userId` | Delete user |
| GET | `/api/admin/export/:dataType` | Export data |
| POST | `/api/admin/train-model` | Start model training |
| GET | `/api/admin/training/status/:jobId` | Check training status |

## Support

For technical issues or questions about the admin dashboard:
1. Check the console logs (browser and backend)
2. Review the error messages
3. Consult the backend logs at `backend/logs/`
4. Check the database connection

---

**Remember:** With great power comes great responsibility. Use admin privileges carefully and maintain regular backups!
