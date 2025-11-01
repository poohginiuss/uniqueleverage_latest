# Facebook Ads Integration - Your Custom Setup

## ✅ What's Ready

Your Facebook Ads API is configured for your **exact workflow**:

### **Campaign Structure:**
- **Objective**: Always `OUTCOME_LEADS` (Lead Generation)
- **Budget**: Lifetime budget (not daily)
- **Conversion Tracking**: Pixel set at Ad Set level
- **Targeting**: State, County, 25/50 mile radius
- **Interests**: Cars.com, AutoTrader, etc. (populated in actual ad)
- **Creative**: User's finalized vehicle images and copy

---

## 🎯 How It Works

### **Step-by-Step Flow:**

**1. User Completes Wizard Steps 1-5**
   - Step 1: Select promotion type & vehicles
   - Step 2: Choose destination (VSP/Messenger)
   - Step 3: Set lifetime budget & duration
   - Step 4: Select targeting (auto-populated from your system)
   - Step 5: Finalize creative (headline, primary text, CTA)

**2. User Clicks "Launch Campaign"**
   - System calls `/api/facebook/create-campaign`
   - Campaign created in Facebook Ads Manager
   - Status: **PAUSED** (ready for review)

**3. Campaign Structure in Facebook:**
   ```
   Campaign (OUTCOME_LEADS)
   └── Ad Set (with pixel & targeting)
       └── Ad (with creative)
   ```

---

## 📋 Integration Code

### **Add to Step 5 (Launch Campaign Button):**

```typescript
// In src/app/marketing/wizard/page.tsx

const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
const [campaignResult, setCampaignResult] = useState<any>(null);

const handleLaunchCampaign = async () => {
  setIsCreatingCampaign(true);
  
  try {
    // Get user's ad account and page
    const userEmail = localStorage.getItem('userEmail');
    
    // Fetch user's Facebook integration
    const integrationResponse = await fetch('/api/facebook/test-permissions');
    const integrationData = await integrationResponse.json();
    
    if (!integrationData.success || integrationData.ad_accounts.length === 0) {
      alert('Please connect your Facebook account first');
      return;
    }
    
    const adAccountId = integrationData.ad_accounts[0].id; // Use first account
    const pageId = integrationData.pages[0]?.id; // Use first page
    
    if (!pageId) {
      alert('No Facebook page found. Please connect a page.');
      return;
    }
    
    // Prepare campaign data
    const campaignData = {
      campaignName: `Vehicle Promotion - ${new Date().toLocaleDateString()}`,
      lifetimeBudget: parseFloat(budget), // From Step 3
      adAccountId: adAccountId,
      pageId: pageId,
      targeting: {
        locations: targetingLocations, // From Step 4
        interests: automotiveInterests, // From Step 4
        demographics: demographics // From Step 4
      },
      headline: headline, // From Step 5
      primaryText: primaryText, // From Step 5
      callToAction: callToAction, // From Step 5
      destinationUrl: destination === 'vsp' 
        ? 'https://your-dealership.com/inventory' 
        : 'https://m.me/your-page',
      creativeImageUrl: selectedVehicles[0]?.image_url, // Vehicle image
      pixelId: 'YOUR_PIXEL_ID' // Add your Facebook Pixel ID here
    };
    
    // Create campaign
    const response = await fetch('/api/facebook/create-campaign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(campaignData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      setCampaignResult(result);
      
      // Show success message
      alert(`✅ Campaign created successfully!\n\nCampaign ID: ${result.campaign.id}\n\nStatus: PAUSED (ready for review)\n\nView in Facebook Ads Manager: ${result.facebook_url}`);
      
      // Optional: Redirect to campaign management page
      // router.push(`/marketing/campaigns/${result.campaign.id}`);
    } else {
      alert(`❌ Failed to create campaign: ${result.error}`);
      console.error('Campaign creation error:', result.details);
    }
    
  } catch (error) {
    console.error('Error launching campaign:', error);
    alert('Failed to launch campaign. Please try again.');
  } finally {
    setIsCreatingCampaign(false);
  }
};
```

### **Update Launch Button in Step 5:**

```tsx
<button
  onClick={handleLaunchCampaign}
  disabled={isCreatingCampaign || !headline || !primaryText}
  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
    isCreatingCampaign || !headline || !primaryText
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
      : 'bg-blue-600 text-white hover:bg-blue-700'
  }`}
>
  {isCreatingCampaign ? (
    <span className="flex items-center justify-center gap-2">
      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      Creating Campaign...
    </span>
  ) : (
    'Launch Campaign'
  )}
</button>
```

---

## 🎨 Image Requirements

Facebook automatically resizes images, but for best results:

**Recommended Dimensions:**
- **1200x628px** (1.91:1 ratio) - Feed ads
- **1080x1080px** (1:1 ratio) - Instagram/Square
- **1080x1920px** (9:16 ratio) - Stories

**Your vehicle images should:**
- Be publicly accessible URLs
- Be under 30MB
- Be JPG or PNG format
- Have minimal text overlay (< 20%)

**Example:**
```typescript
const vehicleImageUrl = selectedVehicles[0]?.image_url;
// e.g., "https://uniqueleverage.com/inventory/images/vehicle-123.jpg"
```

---

## 📍 Targeting Configuration

### **Your Current Setup (Step 4):**

```typescript
// From your wizard state
const [targetingLocations, setTargetingLocations] = useState<Array<{
  id: string;
  name: string;
  type: 'city' | 'state' | 'county' | 'zip';
  lat: number;
  lng: number;
  radius: number; // 25 or 50 miles
}>>([]);

const [automotiveInterests, setAutomotiveInterests] = useState<Array<{
  id: string;
  name: string;
}>>([]);
```

### **How It Maps to Facebook:**

**State Targeting:**
```javascript
// User selects: "Wisconsin"
// Maps to: { regions: [{ key: "3959" }] }
```

**County Targeting:**
```javascript
// User selects: "Milwaukee County, 25 miles"
// Maps to: { 
//   custom_locations: [{
//     latitude: 43.0389,
//     longitude: -87.9065,
//     radius: 25,
//     distance_unit: 'mile'
//   }]
// }
```

**Interest Targeting:**
```javascript
// User selects: "Cars.com", "AutoTrader"
// Maps to: {
//   flexible_spec: [{
//     interests: [
//       { id: "6003107902433", name: "Cars.com" },
//       { id: "6003139266461", name: "AutoTrader" }
//     ]
//   }]
// }
```

---

## 🔧 Facebook Pixel Setup

### **1. Get Your Pixel ID:**
1. Go to [Facebook Events Manager](https://business.facebook.com/events_manager)
2. Select your Pixel
3. Copy the Pixel ID (e.g., `123456789012345`)

### **2. Add to Campaign Creation:**
```typescript
const campaignData = {
  // ... other fields
  pixelId: '123456789012345' // Your actual Pixel ID
};
```

### **3. Pixel Events:**
The pixel will track:
- **Lead** - When someone submits a form
- **PageView** - When someone visits your site
- **ViewContent** - When someone views a vehicle

---

## 💰 Budget Configuration

### **Your Current Setup (Step 3):**

```typescript
const [budget, setBudget] = useState(''); // Lifetime budget
const [selectedDuration, setSelectedDuration] = useState(''); // '1week', '30days', '3months'

// Budget validation
const validateBudget = () => {
  const budgetAmount = parseFloat(budget);
  let minimumRequired = 20;
  
  if (selectedDuration === '3months') {
    minimumRequired = 100;
  } else if (selectedDuration === '30days') {
    minimumRequired = 50;
  }
  
  if (budgetAmount < minimumRequired) {
    setBudgetError(`Minimum budget required: $${minimumRequired}`);
  }
};
```

### **How It Maps to Facebook:**

```javascript
// User enters: $100 for 30 days
// Maps to: { lifetime_budget: 10000 } // cents
```

**Facebook Requirements:**
- Minimum lifetime budget: $20
- Budget must be in cents (multiply by 100)
- Budget is for the entire campaign duration

---

## 🎯 Call-to-Action Options

Your wizard uses: `callToAction` state

**Available CTAs:**
```typescript
const ctaOptions = [
  'LEARN_MORE',    // Default - "Learn More"
  'SHOP_NOW',      // "Shop Now"
  'CONTACT_US',    // "Contact Us"
  'GET_QUOTE',     // "Get Quote"
  'APPLY_NOW',     // "Apply Now"
  'SIGN_UP',       // "Sign Up"
  'DOWNLOAD',      // "Download"
  'BOOK_TRAVEL',   // "Book Now"
  'CALL_NOW',      // "Call Now"
  'MESSAGE_PAGE',  // "Send Message"
  'SUBSCRIBE'      // "Subscribe"
];
```

---

## 📊 Campaign Status Flow

### **After Creation:**

1. **PAUSED** (Initial status)
   - Campaign is created but not running
   - User can review in Facebook Ads Manager
   - No budget is spent

2. **User Reviews in Facebook**
   - Check targeting is correct
   - Verify creative looks good
   - Confirm budget and schedule

3. **User Activates**
   - Click "Publish" in Facebook Ads Manager
   - Status changes to ACTIVE
   - Campaign starts running

4. **Facebook Review**
   - Ads are reviewed (usually < 24 hours)
   - If approved: Ads start showing
   - If rejected: User gets notification with reason

---

## 🚀 Testing Checklist

### **Before Going Live:**

- [ ] **Test with minimal budget** ($20 lifetime)
- [ ] **Verify targeting** appears correctly in Ads Manager
- [ ] **Check creative** displays properly
- [ ] **Confirm pixel** is firing (use Facebook Pixel Helper extension)
- [ ] **Test with one vehicle** before bulk campaigns

### **Test Campaign:**

```typescript
const testCampaignData = {
  campaignName: 'TEST - Do Not Run',
  lifetimeBudget: 20, // Minimum
  adAccountId: 'act_41872014',
  pageId: '1470353646442469',
  targeting: {
    locations: [{
      id: '1',
      name: 'Milwaukee County, WI',
      type: 'county',
      lat: 43.0389,
      lng: -87.9065,
      radius: 25
    }],
    interests: [{ id: '6003107902433', name: 'Cars' }],
    demographics: { minAge: 25, maxAge: 65 }
  },
  headline: 'Test Vehicle - Ignore',
  primaryText: 'This is a test ad. Please ignore.',
  callToAction: 'LEARN_MORE',
  destinationUrl: 'https://uniqueleverage.com',
  creativeImageUrl: 'https://uniqueleverage.com/test-image.jpg',
  pixelId: 'YOUR_PIXEL_ID'
};
```

---

## 🔍 Debugging

### **Common Issues:**

**1. "Failed to create campaign"**
- Check ad account has permissions
- Verify access token is valid
- Ensure budget meets minimum

**2. "Targeting too narrow"**
- Facebook requires 1000+ people in audience
- Expand radius or add more locations

**3. "Image failed to load"**
- Ensure image URL is publicly accessible
- Check image meets size requirements
- Verify URL is HTTPS

**4. "Pixel not found"**
- Verify Pixel ID is correct
- Check Pixel is associated with ad account
- Ensure Pixel is active

### **Debug Logs:**

```typescript
// Add to your campaign creation handler
console.log('Campaign Data:', {
  budget: lifetimeBudget,
  targeting: targetingLocations,
  interests: automotiveInterests,
  creative: {
    headline,
    primaryText,
    image: creativeImageUrl
  }
});
```

---

## 📞 Next Steps

1. **Get Your Facebook Pixel ID**
   - Go to Events Manager
   - Copy Pixel ID
   - Add to campaign creation code

2. **Test Campaign Creation**
   - Use test data
   - Verify it appears in Ads Manager
   - Check all fields are correct

3. **Integrate with Wizard**
   - Add `handleLaunchCampaign` function
   - Update launch button
   - Test end-to-end flow

4. **Go Live!**
   - Test with real vehicle
   - Monitor first campaign
   - Iterate based on performance

---

**You're ready to launch! 🚀**

Everything is configured for your exact workflow:
- ✅ LEADS objective
- ✅ Lifetime budget
- ✅ Pixel at Ad Set level
- ✅ State/County/Radius targeting
- ✅ Interest targeting (Cars.com, AutoTrader, etc.)
- ✅ Vehicle images as creative
