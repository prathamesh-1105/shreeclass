# Google OAuth Setup Guide

## Quick Setup (5 minutes)

### 1. Create Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Select "NEW PROJECT" 
3. Name: "Shree Classes CMS"
4. Click "CREATE"

### 2. Enable Google+ API
1. In search bar, type "Google+ API"
2. Click on it and press "ENABLE"

### 3. Create OAuth Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "+ CREATE CREDENTIALS" > "OAuth client ID"
3. Select "Web application"
4. Application name: "Shree Classes CMS"
5. Authorized JavaScript origins: `http://localhost:5000`
6. Authorized redirect URIs: `http://localhost:5000/auth/google/callback`
7. Click "CREATE"

### 4. Update .env File
Replace in `.env`:
```
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
SESSION_SECRET=any_random_string_here
```

### 5. Restart Server
```bash
taskkill /F /IM node.exe
node server/app.js
```

### 6. Test Google Login
1. Go to http://localhost:5000/pages/login.html
2. Click "Continue with Google"
3. Sign in with your Google account

## Troubleshooting

**Error 401: invalid_client**
- Check that Client ID and Secret are correct in .env
- Make sure redirect URI matches exactly: `http://localhost:5000/auth/google/callback`
- Ensure Google+ API is enabled

**Error 400: redirect_uri_mismatch**
- Verify the redirect URI in Google Console matches exactly
- No trailing slashes or extra characters

## Notes
- Google users are auto-approved and created as students by default
- Admin can change roles in the assignment management
- Existing users will be linked to their Google accounts on first Google login
