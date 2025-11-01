# Standardized Email System ✅ COMPLETE

This system provides a configurable, standardized way to send emails using either `integrations@uniqueleverage.com` or `support@uniqueleverage.com`.

## ✅ Migration Complete

All email endpoints have been successfully migrated to use the standardized email service:

- ✅ **Password Reset** (`/api/forgot-password`) - Now uses `support@uniqueleverage.com`
- ✅ **Email Verification** (`/api/send-verification-email`) - Now uses `support@uniqueleverage.com`
- ✅ **Feed Requests** (`/api/feed-requests/send`) - Now uses `support@uniqueleverage.com`
- ✅ **Login Emails** (`/api/send-login-email`) - Now uses `support@uniqueleverage.com`

## How It Works

The system uses the mail factory (which we know works reliably) and can be configured via environment variable or API calls.

## Configuration Options

### Option 1: Environment Variable (Recommended for Production)

Add to your `.env.local` file:
```bash
EMAIL_SENDER=support@uniqueleverage.com
# or
EMAIL_SENDER=integrations@uniqueleverage.com
```

### Option 2: API Switching (For Testing)

**Check current sender:**
```bash
curl -X GET "http://localhost:3000/api/email-switch"
```

**Switch sender:**
```bash
curl -X POST "http://localhost:3000/api/email-switch" \
  -H "Content-Type: application/json" \
  -d '{"senderEmail": "integrations@uniqueleverage.com"}'
```

## Usage in Code

```typescript
import { emailService } from '@/lib/email/email-service';

// Send an email
const result = await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Test Email',
  text: 'Plain text version',
  html: '<p>HTML version</p>'
});

// Test the current configuration
const testResult = await emailService.testEmail('admin@uniqueleverage.com');
```

## Requirements

- `OUTLOOK_SMTP_PASSWORD` must be set in environment variables
- The sender email must have SMTP AUTH enabled in Microsoft 365
- Both authentication user and "from" address will match the configured sender

## Current Status

✅ **integrations@uniqueleverage.com** - Works (SMTP AUTH enabled)
✅ **support@uniqueleverage.com** - Works (SMTP AUTH enabled)

## Migration Status

1. ✅ Create standardized email service
2. ✅ Test with both email addresses
3. ✅ Update all email endpoints to use new service
4. ✅ Test all migrated endpoints
5. 🔄 Remove old mailer.ts system (optional - can be kept as backup)

## API Endpoints

- `GET /api/email-switch` - Check current sender and available options
- `POST /api/email-switch` - Switch sender (requires server restart for permanent change)

## Benefits Achieved

- ✅ **Eliminated intermittent failures** - No more SMTP AUTH errors
- ✅ **Easy switching** - Change sender via environment variable
- ✅ **Consistent behavior** - All endpoints use the same reliable system
- ✅ **Proper authentication** - Both auth user and "from" address match automatically
- ✅ **Centralized configuration** - One place to manage email settings
