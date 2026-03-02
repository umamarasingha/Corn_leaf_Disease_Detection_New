# 🚀 Quick Start - Admin Dashboard

## Automated Setup (Recommended)

### Option 1: PowerShell Script
```powershell
.\setup-admin.ps1
```

## Manual Setup

### Step 1: Setup Backend Database

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### Step 2: Start Backend Server

```bash
cd backend
npm run dev
```

The backend will start on: `http://localhost:8000`

### Step 3: Start Frontend (New Terminal)

```bash
npm start
```

The frontend will start on: `http://localhost:3000`

### Step 4: Login as Admin

Navigate to: `http://localhost:3000`

**Admin Credentials:**
- Email: `admin@cornleaf.app`
- Password: `admin123`

**Test User:**
- Email: `user@example.com`
- Password: `admin123`

---

## ✅ Admin Dashboard Features

Once logged in as admin, you'll see:

### 1. **Main Dashboard** (Auto-redirected here)
- System statistics
- User analytics
- Detection metrics
- Activity trends
- Quick action buttons

### 2. **Navigation Menu**
Click the menu icon to see:
- 🏠 Dashboard
- 📷 Detect Disease
- 👥 Community Feed
- 📰 News & Updates
- 💬 AI Assistant

**Admin Panel Section:**
- 📊 Admin Dashboard
- 🧠 Model Training
- 📁 Data Management
- ⚙️ Settings

### 3. **Admin Routes**
Direct URLs for admin features:
- `/admin/dashboard` - Main admin dashboard
- `/admin/users` - User management
- `/admin/training` - Model training
- `/admin/data` - Data management
- `/admin/settings` - System settings

---

## 🔧 Troubleshooting

### Problem: "Admin access required" error
**Solution:**
1. Check your user role in database:
   ```bash
   cd backend
   npx prisma studio
   ```
2. Find your user in the User table
3. Verify `role` field is `ADMIN` (uppercase)

### Problem: Backend not connecting
**Solution:**
1. Check if backend is running: `http://localhost:8000`
2. Check console for errors
3. Verify `.env` file exists in `/backend`
4. Check DATABASE_URL in `.env`

### Problem: Database errors
**Solution:**
```bash
cd backend
rm -rf prisma/dev.db
npm run prisma:migrate
npm run prisma:seed
```

### Problem: "Cannot find module" errors
**Solution:**
```bash
# In backend folder
cd backend
npm install

# In root folder
cd ..
npm install
```

---

## 📊 What You'll See

### Dashboard Overview:
✅ Total Users Count  
✅ Total Detections  
✅ Model Accuracy %  
✅ Community Posts  
✅ Disease Distribution Chart  
✅ Weekly Activity Graph  
✅ Recent Activity Feed  
✅ Quick Action Buttons  

### Admin Welcome Banner:
- Your name with ADMIN badge
- System status indicator
- Time period selector
- Export report button

---

## 🎯 Quick Actions Available

From the dashboard, you can quickly:
- **Train Model** - Improve AI with new data
- **Manage Data** - View/organize dataset
- **User Management** - Control user accounts
- **System Settings** - Configure parameters

---

## 🔐 Security Notes

⚠️ **IMPORTANT:**
1. Change default password immediately after first login
2. Go to Settings → Change Password
3. Use a strong, unique password

Default credentials are for development only!

---

## 📱 Mobile View

The admin dashboard is fully responsive:
- On mobile, tap the menu icon (☰) 
- Scroll down to see "Admin Panel" section
- All features available on mobile

---

## 🎉 You're All Set!

Your admin dashboard is ready to use. Enjoy managing your CornLeaf AI system!

**Need Help?** Check the full admin guide: [ADMIN_GUIDE.md](ADMIN_GUIDE.md)
