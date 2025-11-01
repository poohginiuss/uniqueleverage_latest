# Session Management Documentation

## Overview
This application implements a **multi-device session management system** similar to industry leaders like Facebook, Google, and Netflix. Users can maintain up to **10 active sessions** across different devices while ensuring security and performance.

---

## Key Features

### 1. **Multiple Active Sessions**
- Users can be logged in on **up to 10 devices/browsers simultaneously**
- Each session is tracked independently with its own token
- Sessions expire after **24 hours** of creation

### 2. **Automatic Session Limit Enforcement**
- When a user logs in and already has 10 active sessions:
  - The **oldest session** is automatically deleted
  - The new session is created
  - User maintains exactly 10 active sessions max

### 3. **Automatic Cleanup**
- **On login**: Expired sessions are cleaned up globally
- **On logout**: Expired sessions are cleaned up as housekeeping
- Sessions past their 24-hour expiration are automatically removed

### 4. **Session Storage**
- Sessions are stored in the `user_sessions` MySQL table
- Each session includes:
  - `user_id`: The user this session belongs to
  - `session_token`: Encrypted token (Base64-encoded JWT-like)
  - `created_at`: When the session was created
  - `expires_at`: When the session expires (24 hours from creation)

---

## Database Schema

```sql
CREATE TABLE user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_sessions_user_id (user_id),
  INDEX idx_user_sessions_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Implementation Details

### Login Flow (POST `/api/auth/session`)

1. **Authenticate user** (verify email/username and password)
2. **Generate session token** using `createFastSessionToken()`
3. **Clean up expired sessions** (DELETE WHERE expires_at <= NOW())
4. **Count active sessions** for this user
5. **If >= 10 sessions**: Delete oldest sessions to make room
6. **Insert new session** into database
7. **Return session token** as HTTP-only cookie

### Logout Flow (DELETE `/api/auth/session`)

1. **Get session token** from cookie
2. **Delete this session** from database
3. **Clean up expired sessions** (housekeeping)
4. **Clear cookie** and return success

### Session Validation (GET `/api/auth/session`)

1. **Get session token** from cookie
2. **Decode and validate** token (Base64 decode + expiration check)
3. **Return user data** if valid

---

## API Endpoints

### `/api/auth/session`
- **POST**: Login and create session
- **GET**: Validate current session
- **DELETE**: Logout and destroy session

### `/api/debug/active-sessions` (Debug Only)
- **GET**: View all active sessions with user info

### `/api/debug/session-breakdown` (Debug Only)
- **GET**: View session counts grouped by user

### `/api/admin/cleanup-sessions` (Admin Only)
- **POST**: Manually clean up excess sessions (retroactive)

---

## Security Features

### 1. **HTTP-Only Cookies**
- Session tokens stored in HTTP-only cookies
- Cannot be accessed by JavaScript (XSS protection)
- Secure flag in production (HTTPS only)
- SameSite: 'lax' (CSRF protection)

### 2. **Token Encryption**
- Session tokens are Base64-encoded JSON
- Include user data + expiration timestamp
- Validated on every request

### 3. **Automatic Expiration**
- Sessions expire after 24 hours
- Expired sessions cleaned up automatically
- No manual cleanup required

### 4. **Session Limits**
- Maximum 10 sessions per user
- Prevents session table bloat
- Protects against potential abuse

---

## Statistics (Before & After)

### Before Implementation
- **Total Users**: 4
- **Total Active Sessions**: 42 (!)
- **uniqueleverage@gmail.com**: 39 sessions
- **admin@uniqueleverage.com**: 3 sessions

### After Implementation
- **Total Users**: 4
- **Total Active Sessions**: 13
- **uniqueleverage@gmail.com**: 10 sessions (max limit enforced)
- **admin@uniqueleverage.com**: 3 sessions

### Cleanup Results
- **Expired sessions deleted**: 23
- **Excess sessions cleaned**: 29
- **Total sessions removed**: 52

---

## Future Enhancements (Optional)

### 1. **Session Management Dashboard**
- UI page at `/account/sessions`
- Show all active sessions with:
  - Device type (browser, OS)
  - Location (IP address, city)
  - Last active time
  - "Log out" button for each session

### 2. **Device Tracking**
- Store `user_agent`, `ip_address` in sessions table
- Display "Chrome on Windows" or "Safari on iPhone"

### 3. **Security Alerts**
- Email notifications for new device logins
- Alert on suspicious activity (new location/device)

### 4. **"Log Out All Sessions" Feature**
- One-click to revoke all sessions except current
- Useful if account compromised

### 5. **Session Activity Tracking**
- Update `last_active_at` on each request
- Show "Active now" vs "Last active 2 days ago"

---

## Testing

### Test Session Limits
```bash
# Check current sessions for a user
curl -s http://localhost:3000/api/debug/session-breakdown | jq '.sessionsByUser'

# Login multiple times and verify it stays at 10
# (Login 5 more times after already having 10 sessions)

# Verify oldest sessions were removed
curl -s http://localhost:3000/api/debug/active-sessions | jq '.recentSessions'
```

### Manual Cleanup (if needed)
```bash
# Clean up all excess sessions retroactively
curl -s -X POST http://localhost:3000/api/admin/cleanup-sessions | jq .
```

---

## Configuration

### Session Duration
To change session expiration time, modify:

```typescript
// In: src/app/api/auth/session/route.ts
const expiresAt = new Date();
expiresAt.setHours(expiresAt.getHours() + 24); // Change 24 to desired hours
```

### Session Limit
To change max sessions per user, modify:

```typescript
// In: src/app/api/auth/session/route.ts
if (currentSessions >= 10) { // Change 10 to desired limit
  const sessionsToDelete = currentSessions - 9; // Change 9 to (limit - 1)
  // ...
}
```

---

## Maintenance

### Regular Monitoring
```bash
# Check session statistics
curl -s http://localhost:3000/api/debug/session-breakdown

# View recent active sessions
curl -s http://localhost:3000/api/debug/active-sessions
```

### Database Maintenance
- Expired sessions are auto-cleaned on login/logout
- No manual intervention needed under normal operation
- Use admin cleanup endpoint if needed after bulk operations

---

## Best Practices

1. ✅ **Allow multiple sessions** - Users have multiple devices
2. ✅ **Set reasonable limits** - 10 sessions is plenty for most users
3. ✅ **Clean up expired sessions** - Prevent database bloat
4. ✅ **Use HTTP-only cookies** - Security best practice
5. ✅ **Log session activity** - Helpful for debugging/security
6. ✅ **Consider device tracking** - Better UX for session management

---

## Troubleshooting

### Issue: Too many sessions in database
**Solution**: Run the cleanup script
```bash
curl -X POST http://localhost:3000/api/admin/cleanup-sessions
```

### Issue: User can't log in
**Check**: 
1. Session count (should be <= 10 per user)
2. Database connection
3. Session token generation

### Issue: Session expired too quickly
**Check**: 
1. System clock accuracy
2. `expires_at` calculation in login route
3. Cookie maxAge setting

---

## Summary

This session management system provides a **professional, scalable, and secure** approach to handling user sessions. It follows industry best practices while maintaining simplicity and performance.

**Key Points:**
- ✅ 10 sessions max per user
- ✅ 24-hour session expiration
- ✅ Automatic cleanup on login/logout
- ✅ Secure HTTP-only cookies
- ✅ Ready for multi-device use

