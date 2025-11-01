# Hourly Facebook Ads Cron Job Setup for Render

## Overview
This cron job creates 5 new Facebook ad sets and ads every hour to generate consistent API activity for advanced access requests.

## Features
- ✅ **Vehicle Cycling**: Different vehicles each hour (10 vehicle pool)
- ✅ **Comprehensive Reporting**: Fetches impressions, clicks, spend, CTR, etc.
- ✅ **Error Handling**: 30-minute retry delays for critical errors
- ✅ **Rate Limit Protection**: Built-in delays between requests
- ✅ **Database Logging**: Tracks all activity in `facebook_daily_activity` table
- ✅ **Safe Operation**: All ads created in PAUSED status

## Render Cron Job Setup

### 1. Create Cron Job in Render Dashboard

1. Go to your Render dashboard
2. Click "New" → "Cron Job"
3. Configure as follows:

**Name**: `facebook-hourly-ads`
**Schedule**: `0 * * * *` (every hour at minute 0)
**Command**: `curl -X GET https://ul-cursor.onrender.com/api/cron/create-hourly-ads`
**Environment**: `Production`

### 2. Environment Variables Required

Make sure these are set in your Render service:

```bash
# Facebook API Credentials
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
ENCRYPTION_KEY=your_encryption_key

# Database
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# Base URL
NEXT_PUBLIC_BASE_URL=https://ul-cursor.onrender.com
```

### 3. Cron Job Schedule

The cron job runs every hour:
- **Schedule**: `0 * * * *`
- **Description**: Every hour at minute 0
- **Frequency**: 24 times per day
- **Daily Ads Created**: 120 ads (5 per hour × 24 hours)

## Vehicle Pool (Cycles Every 2 Hours)

The system cycles through 10 different vehicles:

### SUVs (5 vehicles):
1. 2016 Honda CR-V EX-L (Blue)
2. 2019 Toyota RAV4 XLE (Red)
3. 2018 Nissan Rogue SV (Gray)
4. 2020 Subaru Outback Limited (Green)
5. 2017 Mazda CX-5 Grand Touring (White)

### Trucks (5 vehicles):
1. 2019 Ford F-150 XLT SuperCrew 4WD (Silver)
2. 2018 Ram 1500 Big Horn Crew Cab 4WD (Blue)
3. 2020 GMC Sierra SLE Double Cab 4WD (White)
4. 2017 Toyota Tacoma TRD Off-Road Double Cab 4WD (Red)
5. 2019 Nissan Titan SV Crew Cab 4WD (Black)

## Reporting Data Fetched

Each hour, the system fetches:
- **Campaign Insights**: Impressions, clicks, spend, reach, frequency, CPC, CPM, CTR
- **Ad Set Insights**: Same metrics for each ad set
- **Ad Insights**: Same metrics for each ad
- **Date Range**: Last 7 days for all insights

## Error Handling

### Automatic Retry Logic:
- **Campaign Archived Error**: Wait 30 minutes, then retry
- **Rate Limit Error**: Wait 30 minutes, then retry
- **General Errors**: Log and continue with next vehicle

### Rate Limit Protection:
- 2-second delay between each ad creation
- Comprehensive error logging
- Graceful failure handling

## Database Logging

All activity is logged to `facebook_daily_activity` table:
- Daily activity summary
- Success/error counts
- Complete results JSON
- Timestamps

## Monitoring

### Check Cron Job Status:
```bash
curl -X GET https://ul-cursor.onrender.com/api/cron/create-hourly-ads
```

### View Recent Activity:
```bash
curl -X GET https://ul-cursor.onrender.com/api/debug/facebook-daily-activity
```

## Safety Features

1. **All Ads Paused**: No accidental spending
2. **Existing Campaign**: Uses campaign `120234125841160089`
3. **Reused Creative**: Uses existing creative `1440488771040179`
4. **Proper Targeting**: SUVs and Trucks interests with Milwaukee location
5. **Budget Control**: $5/day budget per ad set

## Expected Results for Facebook Review

- **Daily API Calls**: ~500+ calls per day
- **Consistent Activity**: Every hour for 15+ days
- **Legitimate Usage**: Real ad creation and reporting
- **No Errors**: Comprehensive error handling
- **Proper Targeting**: Realistic audience targeting

## Troubleshooting

### Common Issues:

1. **Cron Job Not Running**:
   - Check Render cron job status
   - Verify schedule is correct
   - Check environment variables

2. **API Errors**:
   - Check access token validity
   - Verify campaign exists and is active
   - Check rate limits

3. **Database Errors**:
   - Verify database connection
   - Check table exists: `facebook_daily_activity`

### Manual Testing:
```bash
# Test locally
curl -X GET http://localhost:3000/api/cron/create-hourly-ads

# Test on Render
curl -X GET https://ul-cursor.onrender.com/api/cron/create-hourly-ads
```

## Deployment Checklist

- [ ] Cron job created in Render dashboard
- [ ] Environment variables configured
- [ ] Database table `facebook_daily_activity` exists
- [ ] Campaign `120234125841160089` is active
- [ ] Creative `1440488771040179` is available
- [ ] Manual test completed successfully
- [ ] Monitor first few hours of execution
