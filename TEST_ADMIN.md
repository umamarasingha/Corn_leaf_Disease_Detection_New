# Test Admin Dashboard - Quick Guide

## 🚀 Quick Start (One Command)

```powershell
.\start.ps1
```

This will:
1. ✅ Setup database (if needed)
2. ✅ Start backend server (port 8000)
3. ✅ Start frontend app (port 3000)
4. ✅ Open two terminal windows

---

## 📝 Step-by-Step Manual Start

### 1. Start Backend
```powershell
cd backend
npm run dev
```
✅ Backend running at: `http://localhost:8000`

### 2. Start Frontend (New Terminal)
```powershell
npm start
```
✅ Frontend running at: `http://localhost:3000`

---

## 🔑 Login as Admin

1. **Open**: http://localhost:3000
2. **Login with**:
   - Email: `admin@cornleaf.app`
   - Password: `admin123`

3. **You should see**:
   - ✅ Welcome banner with ADMIN badge
   - ✅ System statistics cards
   - ✅ Disease distribution chart
   - ✅ Weekly activity trends
   - ✅ Quick action buttons
   - ✅ Recent activity feed

---

## 📱 Check Admin Features

### Main Dashboard (Auto-redirected)
- On login, you're automatically taken to the Admin Dashboard
- Shows system overview and statistics

### Navigation Menu
Click the menu icon (☰) to see:

**Standard Menu:**
- 🏠 Dashboard (redirects to Admin Dashboard for admins)
- 📷 Detect Disease
- 👥 Community Feed
- 📰 News & Updates
- 💬 AI Assistant

**Admin Panel** (only visible for admin):
- 📊 Admin Dashboard
- 🧠 Model Training
- 📁 Data Management
- ⚙️ Settings

### Direct URLs for Admin Pages
When logged in as admin, you can access:
- http://localhost:3000/ → Admin Dashboard
- http://localhost:3000/admin/dashboard → Admin Dashboard
- http://localhost:3000/admin/users → User Management
- http://localhost:3000/admin/training → Model Training
- http://localhost:3000/admin/data → Data Management

---

## ✅ What to Verify

### 1. Login redirects to Admin Dashboard
- ✅ After login, you should see the admin welcome banner
- ✅ URL should be `http://localhost:3000/`
- ✅ Page shows "Welcome back, Admin User" with ADMIN badge

### 2. Check Admin Badge in Sidebar
- ✅ Open sidebar (click ☰ icon)
- ✅ Should show "Admin Panel" section
- ✅ Admin menu items should be visible

### 3. Test Admin Statistics
- ✅ Dashboard shows user count
- ✅ Dashboard shows detection count
- ✅ Dashboard shows model accuracy
- ✅ Dashboard shows community posts

### 4. Test Admin Routes
Try navigating to:
- ✅ `/admin/dashboard` - Should work
- ✅ `/admin/users` - Should work
- ✅ `/admin/training` - Should work
- ✅ `/admin/data` - Should work

---

## 🔧 Troubleshooting

### Problem: White screen or errors

**Solution:**
```powershell
# Clear cache and restart
cd backend
Remove-Item -Recurse -Force node_modules
npm install

cd ..
Remove-Item -Recurse -Force node_modules
npm install

.\start.ps1
```

### Problem: "Cannot connect to backend"

**Check:**
1. Backend is running: Open http://localhost:8000
2. Check terminal for errors
3. Verify `.env` exists in `backend` folder

### Problem: Not seeing Admin features

**Verify user role:**
```powershell
cd backend
npx prisma studio
```
- Open User table
- Find `admin@cornleaf.app`
- Check `role` field is `ADMIN` (uppercase)

### Problem: Login fails

**Reset database:**
```powershell
cd backend
Remove-Item prisma\dev.db
npm run prisma:migrate
npm run prisma:seed
```

---

## 🎯 Expected Behavior

### ✅ For Admin Users:
1. Login → Automatically redirected to Admin Dashboard
2. Homepage (`/`) → Shows Admin Dashboard
3. Sidebar → Shows Admin Panel section
4. All admin routes accessible

### ❌ For Regular Users:
1. Login → Redirected to Community Feed
2. Homepage (`/`) → Shows Community Feed
3. Sidebar → No Admin Panel section
4. Admin routes blocked (redirect to home)

---

## 📊 Dashboard Features

### Stats Cards (Top Section):
- 👥 **Total Users** - Count with growth percentage
- 📷 **Total Detections** - Disease detection count
- 🧠 **Model Accuracy** - AI model performance
- 📝 **Community Posts** - Total posts count

### Charts:
- 📊 **Disease Distribution** - Pie chart with percentages
- 📈 **Weekly Activity** - Line chart showing trends

### Quick Actions:
- 🧠 **Train Model** → Go to Model Training
- 📁 **Manage Data** → Go to Data Management
- 👥 **User Management** → Go to User Management
- ⚙️ **System Settings** → Configure system

### Recent Activity:
- Live feed of system events
- User actions and system changes
- Color-coded by severity

---

## 🎉 Success Indicators

You'll know everything is working when:

1. ✅ Login as admin takes you to admin dashboard
2. ✅ Welcome banner shows "Welcome back, Admin User" with crown icon
3. ✅ Statistics show real numbers (not zeros)
4. ✅ Sidebar has "Admin Panel" section
5. ✅ All admin routes are accessible
6. ✅ Quick actions navigate correctly

---

## 📞 Need Help?

If something isn't working:

1. Check both terminal windows for error messages
2. Check browser console (F12) for errors
3. Verify database file exists: `backend/prisma/dev.db`
4. Verify both servers are running (ports 3000 and 8000)
5. Try clearing browser cache and localStorage

---

**Happy Testing!** 🎊
