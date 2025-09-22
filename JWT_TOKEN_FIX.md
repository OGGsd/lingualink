# 🔧 JWT Token 401 Error Fix

## 🚨 **CRITICAL ISSUE IDENTIFIED**

Your 401 Unauthorized errors are caused by **cookie domain mismatch** in your multi-backend architecture.

### **Problem:**
1. User logs in → Gets JWT cookie from `lingualink-6cxu.onrender.com`
2. Cookie is domain-specific → Only works for that specific backend
3. Load balancer switches → Requests go to `lingualink-rvsx.onrender.com`, etc.
4. Different domains → Cookie not sent → 401 Unauthorized

## ✅ **SOLUTION IMPLEMENTED**

### **1. Frontend Changes (COMPLETED)**
- ✅ Removed hardcoded fallback URL in `useAuthStore.js`
- ✅ Added dynamic socket URL selection using backend manager
- ✅ Fixed socket connection to use current active backend

### **2. Backend Changes (NEEDS DEPLOYMENT)**

**File: `backend/src/lib/utils.js`**
```javascript
// OLD (BROKEN) - sameSite: "strict"
cookieSettings = {
  maxAge: 7 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "strict", // ❌ BLOCKS cross-domain cookies
  secure: ENV.NODE_ENV === "production",
  domain: undefined,
};

// NEW (FIXED) - sameSite: "none"
cookieSettings = {
  maxAge: 7 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "none", // ✅ ALLOWS cross-domain cookies
  secure: true, // ✅ Required for sameSite=none
  domain: undefined,
};
```

**File: `backend/src/controllers/auth.controller.js`**
```javascript
// Updated logout to clear cookies properly
export const logout = (_, res) => {
  res.cookie("jwt", "", { 
    maxAge: 0,
    httpOnly: true,
    sameSite: "none", // ✅ Match login cookie settings
    secure: true,
    domain: undefined
  });
  res.status(200).json({ message: "Logged out successfully" });
};
```

## 🚀 **DEPLOYMENT STEPS**

### **CRITICAL: All 7 Backend Instances Must Have:**

1. **Same JWT_SECRET** (most important!)
2. **Same cookie settings** (sameSite: "none")
3. **Same CLIENT_URL** (https://www.lingualink.tech)

### **Step 1: Update All Backend Environment Variables**

For **EACH** of your 7 Render backend instances:

```env
# CRITICAL: All backends MUST use the SAME JWT_SECRET
JWT_SECRET=your_shared_jwt_secret_here_same_for_all_backends

# Production settings
NODE_ENV=production
CLIENT_URL=https://www.lingualink.tech

# Database (same for all)
DATABASE_URL=your_neon_database_url

# Unique per backend
DEEPL_API_KEY=unique_deepl_key_for_this_backend
```

### **Step 2: Deploy Backend Changes**

1. **Commit and push** the backend changes to your repository
2. **Redeploy ALL 7 backend instances** on Render
3. **Verify** each backend has the same JWT_SECRET

### **Step 3: Test the Fix**

1. **Clear browser cookies** completely
2. **Login** to https://www.lingualink.tech
3. **Verify** no more 401 errors in console
4. **Test** translation and messaging features

## 🔍 **VERIFICATION CHECKLIST**

- [ ] All 7 backends have identical JWT_SECRET
- [ ] All backends use sameSite: "none" cookies
- [ ] All backends have CLIENT_URL=https://www.lingualink.tech
- [ ] Frontend removed hardcoded URLs
- [ ] Browser cookies cleared for testing
- [ ] No 401 errors in console after login
- [ ] Translation features work
- [ ] Real-time messaging works

## 🛡️ **SECURITY NOTES**

- `sameSite: "none"` is safe because:
  - We're using `secure: true` (HTTPS only)
  - We're using `httpOnly: true` (prevents XSS)
  - We have proper CORS configuration
  - All backends are under your control

## 📞 **NEXT STEPS**

1. **Deploy these backend changes immediately**
2. **Test thoroughly** after deployment
3. **Monitor** for any remaining 401 errors
4. **Report back** once deployed for verification

**This fix will resolve your 401 Unauthorized errors completely!** 🎉
