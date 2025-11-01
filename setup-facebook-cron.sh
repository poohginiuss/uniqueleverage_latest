#!/bin/bash

# Facebook API Activity Cron Jobs Setup
# This script helps you set up multiple cron jobs on Render for Facebook API approval

echo "🚀 Setting up Facebook API Activity Cron Jobs for App Review Approval"
echo "================================================================"

# Base URL for your Render app
BASE_URL="https://ul-cursor.onrender.com"

# Different strategies to rotate through
STRATEGIES=(
    "comprehensive_read"
    "insights_focused" 
    "campaign_management"
    "audience_research"
    "creative_testing"
)

echo "📋 Available Strategies:"
for i in "${!STRATEGIES[@]}"; do
    echo "  $((i+1)). ${STRATEGIES[$i]}"
done

echo ""
echo "🕐 Recommended Cron Schedule:"
echo "  - Every 15 minutes: Rotate through strategies"
echo "  - Every hour: Comprehensive read"
echo "  - Every 2 hours: Campaign management"
echo "  - Every 4 hours: Insights focused"
echo "  - Every 6 hours: Audience research"
echo "  - Every 8 hours: Creative testing"

echo ""
echo "📝 Cron Job Commands for Render:"

# Generate cron commands for different frequencies
echo ""
echo "# Every 15 minutes - Rotate strategies"
echo "*/15 * * * * curl -X GET \"$BASE_URL/api/cron/facebook-activity-rotating?strategy=comprehensive_read\" > /dev/null 2>&1"
echo "*/15 * * * * curl -X GET \"$BASE_URL/api/cron/facebook-activity-rotating?strategy=insights_focused\" > /dev/null 2>&1"
echo "*/15 * * * * curl -X GET \"$BASE_URL/api/cron/facebook-activity-rotating?strategy=campaign_management\" > /dev/null 2>&1"

echo ""
echo "# Every hour - Comprehensive activity"
echo "0 * * * * curl -X GET \"$BASE_URL/api/cron/comprehensive-facebook-activity\" > /dev/null 2>&1"

echo ""
echo "# Every 2 hours - Campaign management"
echo "0 */2 * * * curl -X GET \"$BASE_URL/api/cron/facebook-activity-rotating?strategy=campaign_management\" > /dev/null 2>&1"

echo ""
echo "# Every 4 hours - Insights focused"
echo "0 */4 * * * curl -X GET \"$BASE_URL/api/cron/facebook-activity-rotating?strategy=insights_focused\" > /dev/null 2>&1"

echo ""
echo "# Every 6 hours - Audience research"
echo "0 */6 * * * curl -X GET \"$BASE_URL/api/cron/facebook-activity-rotating?strategy=audience_research\" > /dev/null 2>&1"

echo ""
echo "# Every 8 hours - Creative testing"
echo "0 */8 * * * curl -X GET \"$BASE_URL/api/cron/facebook-activity-rotating?strategy=creative_testing\" > /dev/null 2>&1"

echo ""
echo "🎯 API Permissions Covered:"
echo "  ✅ pages_show_list - List user pages"
echo "  ✅ pages_read_engagement - Read page insights and posts"
echo "  ✅ ads_read - Read ad account data, campaigns, ad sets, ads, insights"
echo "  ✅ ads_management - Create campaigns, ad sets, manage ads"

echo ""
echo "📊 Expected Daily Activity:"
echo "  - Comprehensive reads: 24 calls/day"
echo "  - Strategy rotations: 288 calls/day (every 15 min)"
echo "  - Campaign management: 12 calls/day"
echo "  - Insights focused: 6 calls/day"
echo "  - Audience research: 4 calls/day"
echo "  - Creative testing: 3 calls/day"
echo "  - Total: ~337 API calls per day"

echo ""
echo "⚠️  Rate Limiting Notes:"
echo "  - Each strategy includes delays between users"
echo "  - Failed calls are logged but don't stop execution"
echo "  - All campaigns/ad sets created are PAUSED"
echo "  - Focus on read operations to avoid spending money"

echo ""
echo "🔧 Setup Instructions:"
echo "  1. Go to your Render dashboard"
echo "  2. Navigate to your app's Cron Jobs section"
echo "  3. Add each cron job with the commands above"
echo "  4. Monitor the logs to ensure they're running"
echo "  5. Check the database for activity logs"

echo ""
echo "📈 Monitoring:"
echo "  - Check /api/cron/comprehensive-facebook-activity for detailed logs"
echo "  - Monitor facebook_daily_activity table in your database"
echo "  - Watch for rate limit errors in Render logs"

echo ""
echo "✅ Ready to deploy! Run 'git add . && git commit -m \"Add comprehensive Facebook API activity cron jobs\" && git push origin main'"
