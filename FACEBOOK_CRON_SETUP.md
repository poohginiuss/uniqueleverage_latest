# Facebook Daily Activity Cron Job Setup

## 🎯 **Purpose**
This cron job automatically creates daily Facebook API activity to meet Facebook's requirements for app review:
- Daily API calls for 15+ consecutive days
- Campaign and ad set creation (always paused - no money spent)
- Insights fetching for API activity tracking

## 🚀 **Setup Instructions**

### Option 1: Render Cron Job (Recommended)

1. **Go to your Render dashboard**
2. **Create a new Cron Job:**
   - Name: `facebook-daily-activity`
   - Schedule: `0 9 * * *` (daily at 9 AM UTC)
   - Command: `curl -X GET https://ul-cursor.onrender.com/api/cron/facebook-daily-activity`
   - Environment: Production

3. **Set Environment Variables:**
   - Copy all environment variables from your main web service
   - Ensure `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` are set
   - Ensure `ENCRYPTION_KEY` is set

### Option 2: External Cron Service

Use services like:
- **cron-job.org** (free)
- **EasyCron** (free tier)
- **Cronitor** (paid)

**Settings:**
- URL: `https://ul-cursor.onrender.com/api/cron/facebook-daily-activity`
- Method: GET
- Schedule: Daily at 9 AM UTC
- Timezone: UTC

### Option 3: GitHub Actions (Free)

Create `.github/workflows/facebook-daily-activity.yml`:

```yaml
name: Facebook Daily Activity
on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  facebook-activity:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Facebook Daily Activity
        run: |
          curl -X GET https://ul-cursor.onrender.com/api/cron/facebook-daily-activity
```

## 📊 **What the Cron Job Does**

### Daily Activities:
1. **Campaign Creation** - Creates a paused test campaign
2. **Ad Set Creation** - Creates a paused test ad set (if campaign succeeds)
3. **Insights Fetching** - Fetches account insights for API activity
4. **Database Logging** - Logs all activities to `facebook_daily_activity` table

### Safety Features:
- ✅ All campaigns and ad sets are created in **PAUSED** status
- ✅ **No money is spent** - everything is paused
- ✅ Comprehensive error handling and logging
- ✅ Rate limiting between API calls

## 🔍 **Monitoring**

### Check Cron Job Status:
```bash
curl https://ul-cursor.onrender.com/api/cron/facebook-daily-activity
```

### Expected Response:
```json
{
  "success": true,
  "message": "Facebook Daily Activity completed for X users",
  "date": "2025-10-19T04:51:26.915Z",
  "activities": [...],
  "summary": {
    "total_users": 1,
    "successful_activities": 2,
    "failed_activities": 1,
    "error_activities": 0
  }
}
```

### Database Monitoring:
Check the `facebook_daily_activity` table for daily logs:
```sql
SELECT * FROM facebook_daily_activity ORDER BY date DESC LIMIT 7;
```

## ⚠️ **Important Notes**

1. **No Money Spent**: All campaigns and ad sets are created in PAUSED status
2. **Rate Limiting**: 1-second delay between users to avoid rate limits
3. **Error Handling**: Failed activities are logged but don't stop the process
4. **Database Logging**: All activities are stored for tracking
5. **Multiple Users**: Processes all users with Facebook integrations

## 🎯 **Facebook App Review Requirements**

This cron job helps meet Facebook's requirements:
- ✅ **Daily Activity**: Runs every day automatically
- ✅ **API Calls**: Creates campaigns, ad sets, and fetches insights
- ✅ **15+ Days**: Run for 15+ consecutive days before submitting for review
- ✅ **Successful Responses**: Creates 200 responses from Facebook API
- ✅ **No Money Spent**: All campaigns are paused

## 🚀 **Next Steps**

1. **Set up the cron job** using one of the methods above
2. **Run for 15+ days** to build activity history
3. **Submit Facebook app for review** once you have sufficient activity
4. **Monitor daily** to ensure the cron job is working correctly

## 🔧 **Troubleshooting**

### Common Issues:
1. **"No Facebook integrations found"** - Make sure users have connected Facebook
2. **"Ad set creation failed"** - Expected due to development mode limitations
3. **Database errors** - Check environment variables are set correctly
4. **Rate limiting** - The cron job includes delays to prevent this

### Debug Commands:
```bash
# Test the endpoint manually
curl https://ul-cursor.onrender.com/api/cron/facebook-daily-activity

# Check database logs
# (Use your database client to query facebook_daily_activity table)
```

## 📈 **Success Metrics**

After 15 days, you should see:
- ✅ 15+ entries in `facebook_daily_activity` table
- ✅ 15+ successful campaign creations
- ✅ 15+ insights fetches
- ✅ Consistent daily API activity

This will satisfy Facebook's requirements for app review!
