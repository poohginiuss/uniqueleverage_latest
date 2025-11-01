# Gmail OAuth Integration Setup Guide

## Prerequisites

1. **Google Cloud Console Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Gmail API

2. **OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`

## Environment Variables

Add these to your `.env.local` file:

```bash
# Google OAuth 2.0 Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Gmail API Scopes

The integration requests these permissions:
- `https://www.googleapis.com/auth/gmail.readonly` - Read Gmail messages
- `https://www.googleapis.com/auth/gmail.send` - Send emails via Gmail
- `https://www.googleapis.com/auth/userinfo.email` - Access user email
- `https://www.googleapis.com/auth/userinfo.profile` - Access user profile

## How It Works

1. **User clicks "Connect with Gmail"** → Opens modal
2. **Modal initiates OAuth** → Redirects to Google
3. **User authorizes** → Google redirects back with code
4. **Callback exchanges code** → Gets access/refresh tokens
5. **Tests Gmail access** → Verifies connection works
6. **Updates UI** → Shows Gmail as connected

## Security Notes

- Tokens are currently passed via URL (for demo)
- In production, store tokens securely in database
- Use refresh tokens to maintain long-term access
- Implement proper token refresh logic

## Testing

1. Set up environment variables
2. Restart development server
3. Go to `/docs/integrations`
4. Click "Connect with Gmail"
5. Complete OAuth flow
6. Verify Gmail shows as connected
