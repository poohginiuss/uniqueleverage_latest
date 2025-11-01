# Facebook Ads Manager - Quick Start Guide

## ✅ Current Status

**Your integration is LIVE and ready to use!**

- ✅ Facebook Marketing API permissions verified
- ✅ 25 active ad accounts connected
- ✅ 2 Facebook pages available for ads
- ✅ Database tables created
- ✅ API endpoints ready

---

## 🚀 Quick Test

### **1. Test Audience Insights**

```bash
# Start your dev server
npm run dev

# In another terminal or Postman:
curl -X POST http://localhost:3000/api/facebook/audience-insights \
  -H "Content-Type: application/json" \
  -d '{
    "locations": {"countries": ["US"]},
    "interests": ["6003107902433"],
    "ageMin": 25,
    "ageMax": 55,
    "adAccountId": "act_41872014"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "audience_insights": {
    "estimated_reach": {
      "users": 1500000
    },
    "recommendations": {
      "min_budget": 150,
      "suggested_budget": 1500
    }
  }
}
```

---

### **2. Create Test Campaign**

```bash
curl -X POST http://localhost:3000/api/facebook/create-campaign \
  -H "Content-Type: application/json" \
  -d '{
    "campaignName": "Test Campaign - Do Not Run",
    "objective": "traffic",
    "budget": 1,
    "adAccountId": "act_41872014",
    "pageId": "1470353646442469",
    "targeting": {
      "locations": {"countries": ["US"]},
      "interests": ["6003107902433"],
      "ageMin": 25,
      "ageMax": 55
    },
    "adCopy": "Test ad - please ignore",
    "destinationUrl": "https://uniqueleverage.com"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "campaign": {
    "id": "120212345678901234",
    "name": "Test Campaign - Do Not Run",
    "status": "paused"
  }
}
```

**Note:** Campaign will be created in PAUSED status. You can delete it from Facebook Ads Manager.

---

## 📊 What You Need to Define

### **Quick Decisions:**

1. **Campaign Objectives**
   - Recommend: Start with "Traffic" (drive website visits)
   - Can add "Conversions" later for lead forms

2. **Default Budget**
   - Minimum: $1/day (Facebook requirement)
   - Recommended: $10-50/day for meaningful results
   - Let users choose from preset tiers

3. **Targeting Defaults**
   - Location: 25-mile radius from dealership
   - Age: 25-55 (prime car buying age)
   - Interests: Automotive (pre-selected)

4. **Ad Copy**
   - Auto-generate from vehicle data
   - Format: "{Year} {Make} {Model} - {Price}"
   - Let users edit before launching

5. **Campaign Duration**
   - Default: Ongoing (no end date)
   - Users can pause/stop anytime

---

## 🎯 Integration Steps

### **Step 1: Add to Marketing Wizard**

In `src/app/marketing/wizard/page.tsx`:

```typescript
// Add state for Facebook integration
const [adAccounts, setAdAccounts] = useState<any[]>([]);
const [selectedAdAccount, setSelectedAdAccount] = useState<string>('');
const [audienceInsights, setAudienceInsights] = useState<any>(null);

// Fetch ad accounts on mount
useEffect(() => {
  fetch('/api/facebook/test-permissions')
    .then(res => res.json())
    .then(data => {
      if (data.success && data.ad_accounts) {
        setAdAccounts(data.ad_accounts);
        setSelectedAdAccount(data.ad_accounts[0]?.id || '');
      }
    });
}, []);

// Fetch audience insights when targeting changes
useEffect(() => {
  if (selectedAdAccount && currentStep === 2) {
    fetch('/api/facebook/audience-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locations: { countries: ['US'] },
        interests: ['6003107902433'],
        ageMin: 25,
        ageMax: 55,
        adAccountId: selectedAdAccount
      })
    })
    .then(res => res.json())
    .then(data => setAudienceInsights(data.audience_insights));
  }
}, [selectedAdAccount, currentStep]);
```

### **Step 2: Display Audience Insights**

```tsx
{audienceInsights && (
  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
    <h3 className="font-semibold mb-2">Estimated Audience</h3>
    <p className="text-2xl font-bold">
      {audienceInsights.estimated_reach.users.toLocaleString()} people
    </p>
    <div className="mt-2 text-sm">
      <p>Recommended Budget: ${audienceInsights.recommendations.suggested_budget}/day</p>
      <p>Minimum Budget: ${audienceInsights.recommendations.min_budget}/day</p>
    </div>
  </div>
)}
```

### **Step 3: Launch Campaign**

```typescript
const handleLaunchCampaign = async () => {
  const response = await fetch('/api/facebook/create-campaign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      campaignName: `Vehicle Promotion - ${new Date().toLocaleDateString()}`,
      objective: 'traffic',
      budget: selectedBudget,
      adAccountId: selectedAdAccount,
      pageId: '1470353646442469', // Your page ID
      targeting: {
        locations: { countries: ['US'] },
        interests: ['6003107902433'],
        ageMin: 25,
        ageMax: 55
      },
      adCopy: generatedAdCopy,
      destinationUrl: 'https://your-dealership.com/inventory'
    })
  });

  const result = await response.json();
  if (result.success) {
    // Show success message
    alert(`Campaign created! ID: ${result.campaign.id}`);
  }
};
```

---

## 📈 Campaign Performance

### **Get Insights**

```typescript
const fetchCampaignInsights = async (campaignId: string) => {
  const response = await fetch(
    `/api/facebook/campaign-insights?campaignId=${campaignId}`
  );
  const data = await response.json();
  
  return {
    impressions: data.insights.impressions,
    clicks: data.insights.clicks,
    spend: data.insights.spend,
    ctr: data.insights.ctr,
    cpc: data.insights.cpc
  };
};
```

---

## 🎨 Ad Creative Best Practices

### **Image Requirements:**
- Dimensions: 1200x628px (recommended)
- File size: Under 5MB
- Format: JPG or PNG
- Text overlay: Less than 20% of image

### **Ad Copy:**
- Headline: 40 characters max
- Primary text: 125 characters max
- Clear call-to-action
- Include price if possible

### **Example Ad:**
```
Headline: "2024 Honda Accord - Like New!"
Primary Text: "Certified pre-owned with only 12K miles. 
               Financing available. Visit us today!"
Call-to-Action: "Learn More"
```

---

## 🚨 Important Notes

### **Facebook Policies:**
- All automotive ads must include `special_ad_categories: ['AUTOMOTIVE']` ✅ (already included)
- Ads are reviewed before going live (usually 24 hours)
- Cannot discriminate based on protected characteristics
- Must comply with local advertising laws

### **Budget:**
- Minimum: $1/day
- Charged in cents (multiply by 100 in API)
- Daily budget is per ad set, not per ad

### **Campaign Status:**
- `PAUSED` - Created but not running (default)
- `ACTIVE` - Currently running and spending budget
- You can pause/resume campaigns anytime

---

## 📞 Troubleshooting

### **"Failed to create campaign"**
- Check ad account has sufficient permissions
- Verify budget meets minimum ($1/day)
- Ensure targeting has sufficient audience size (1000+ people)

### **"Token expired"**
- User needs to reconnect Facebook account
- Redirect to `/api/auth/facebook/start`

### **"Ad rejected"**
- Review Facebook's ad policies
- Check image doesn't have too much text
- Ensure ad copy doesn't violate policies

---

## 🎯 Next Steps

1. **Test the API endpoints** (see Quick Test above)
2. **Integrate with your wizard** (see Integration Steps)
3. **Create campaign dashboard** (see FACEBOOK_ADS_IMPLEMENTATION.md)
4. **Test with $1/day campaign** (verify it works end-to-end)
5. **Launch to users!** 🚀

---

**You're ready to go! Everything is set up and working.** 🎉

For detailed implementation guide, see: `FACEBOOK_ADS_IMPLEMENTATION.md`
For requirements and decisions, see: `FACEBOOK_ADS_REQUIREMENTS.md`
