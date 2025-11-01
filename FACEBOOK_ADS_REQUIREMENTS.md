# Facebook Ads Manager - What You Need to Prepare

## ✅ Already Complete

You already have everything you need! Your Facebook integration is **fully operational**.

### **✅ Confirmed Working:**
- Facebook Marketing API permissions
- 25 active ad accounts
- 2 Facebook pages for ad creation
- User authentication and token storage
- Database tables for campaigns and insights

---

## 🎯 What You Need to Define

### **1. Campaign Objectives**
Decide which objectives to support in your wizard:

| Objective | Use Case | Best For |
|-----------|----------|----------|
| **REACH** | Show ads to maximum people | Brand awareness, new dealership |
| **TRAFFIC** | Drive website visits | Inventory browsing, test drives |
| **CONVERSIONS** | Get specific actions | Lead forms, purchases |
| **ENGAGEMENT** | Get likes/comments/shares | Social proof, community building |

**Recommendation:** Start with **TRAFFIC** (most common for dealerships)

---

### **2. Budget Structure**
Define budget options for your users:

```typescript
const budgetOptions = [
  { label: 'Starter', daily: 10, monthly: 300, reach: '1,000-3,000/day' },
  { label: 'Growth', daily: 25, monthly: 750, reach: '3,000-8,000/day' },
  { label: 'Premium', daily: 50, monthly: 1500, reach: '8,000-15,000/day' },
  { label: 'Enterprise', daily: 100, monthly: 3000, reach: '15,000-30,000/day' },
  { label: 'Custom', daily: null, monthly: null, reach: 'Custom' }
];
```

**Facebook Requirements:**
- Minimum: $1/day
- Recommended minimum: $10/day for meaningful results
- Budget is per ad set (not per ad)

---

### **3. Targeting Options**

#### **A. Geographic Targeting**
What locations should users be able to target?

```typescript
const locationOptions = {
  // Radius around dealership
  radius: {
    enabled: true,
    options: [5, 10, 25, 50, 100], // miles
    default: 25
  },
  
  // Specific cities
  cities: {
    enabled: true,
    searchable: true // Let users search for cities
  },
  
  // States/Regions
  regions: {
    enabled: true,
    multiSelect: true
  },
  
  // Countries
  countries: {
    enabled: true,
    default: ['US']
  }
};
```

**Recommendation:** Auto-detect dealership location and default to 25-mile radius

#### **B. Demographic Targeting**
What age ranges and genders?

```typescript
const demographicOptions = {
  age: {
    min: 18, // Facebook minimum
    max: 65,
    default: [25, 55] // Most car buyers
  },
  
  gender: {
    options: ['all', 'male', 'female'],
    default: 'all'
  }
};
```

#### **C. Interest Targeting**
What interests should be available?

**Automotive Interests (Facebook IDs):**
```typescript
const automotiveInterests = [
  { id: '6003107902433', name: 'Cars', audience: '150M+' },
  { id: '6003139266461', name: 'Automobiles', audience: '100M+' },
  { id: '6003080297498', name: 'Automotive industry', audience: '80M+' },
  { id: '6003196186608', name: 'Luxury vehicles', audience: '50M+' },
  { id: '6003348604581', name: 'Sport utility vehicle', audience: '40M+' },
  { id: '6003020834693', name: 'Truck', audience: '35M+' },
  { id: '6003050929098', name: 'Electric vehicle', audience: '25M+' },
  { id: '6003139266661', name: 'Automotive', audience: '120M+' }
];
```

**Recommendation:** Pre-select 2-3 relevant interests based on inventory type

---

### **4. Ad Creative Requirements**

#### **A. Image Specifications**
```typescript
const imageRequirements = {
  dimensions: {
    recommended: { width: 1200, height: 628 }, // 1.91:1 ratio
    minimum: { width: 600, height: 314 },
    square: { width: 1080, height: 1080 } // For Instagram
  },
  
  fileSize: {
    max: 30, // MB
    recommended: 5 // MB
  },
  
  format: ['jpg', 'png'],
  
  textOverlay: {
    max: 20 // % of image (Facebook policy)
  }
};
```

**Your Current Images:**
- Vehicle images from inventory (already have these)
- Need to ensure they meet Facebook specs
- May need to auto-resize/crop

#### **B. Ad Copy Structure**
```typescript
const adCopyStructure = {
  headline: {
    maxLength: 40,
    example: '2024 Honda Accord - Like New!'
  },
  
  primaryText: {
    maxLength: 125,
    example: 'Certified pre-owned with low miles. Financing available. Visit us today!'
  },
  
  description: {
    maxLength: 30,
    example: 'Shop our inventory'
  },
  
  callToAction: {
    options: [
      'LEARN_MORE',
      'SHOP_NOW',
      'CONTACT_US',
      'GET_QUOTE',
      'APPLY_NOW'
    ],
    default: 'LEARN_MORE'
  }
};
```

**Recommendation:** Auto-generate copy from vehicle data:
```typescript
function generateAdCopy(vehicle) {
  return {
    headline: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    primaryText: `${vehicle.condition} • ${vehicle.mileage} miles • $${vehicle.price}. ${vehicle.features.slice(0, 2).join(', ')}. Contact us today!`,
    description: 'View Details',
    callToAction: 'LEARN_MORE'
  };
}
```

---

### **5. Campaign Naming Convention**
How should campaigns be named?

```typescript
const campaignNamingConvention = {
  format: '{dealership} - {type} - {date}',
  examples: [
    'Gulf Sea Auto - Summer Sale - 2025-10-13',
    'Gulf Sea Auto - New Arrivals - 2025-10-13',
    'Gulf Sea Auto - Clearance Event - 2025-10-13'
  ]
};
```

**Recommendation:** Let users customize but provide smart defaults

---

### **6. Campaign Duration**
How long should campaigns run?

```typescript
const campaignDuration = {
  options: [
    { label: '1 Week', days: 7 },
    { label: '2 Weeks', days: 14 },
    { label: '1 Month', days: 30 },
    { label: 'Ongoing', days: null } // No end date
  ],
  default: 'Ongoing'
};
```

**Recommendation:** Default to "Ongoing" with option to pause/stop anytime

---

### **7. Ad Placement Options**
Where should ads appear?

```typescript
const placementOptions = {
  automatic: {
    enabled: true,
    label: 'Automatic Placements (Recommended)',
    description: 'Facebook optimizes where your ads appear'
  },
  
  manual: {
    enabled: true,
    options: {
      facebook: {
        feed: true,
        stories: true,
        marketplace: true,
        videoFeeds: true,
        rightColumn: false // Usually poor performance
      },
      instagram: {
        feed: true,
        stories: true,
        explore: true
      },
      messenger: {
        inbox: true,
        stories: true
      },
      audienceNetwork: {
        native: true,
        banner: false
      }
    }
  }
};
```

**Recommendation:** Start with "Automatic Placements" for best results

---

### **8. Optimization Goals**
What should Facebook optimize for?

```typescript
const optimizationGoals = {
  traffic: [
    { value: 'LINK_CLICKS', label: 'Link Clicks (Most clicks to website)' },
    { value: 'LANDING_PAGE_VIEWS', label: 'Landing Page Views (People who load page)' }
  ],
  
  conversions: [
    { value: 'CONVERSIONS', label: 'Conversions (Specific actions)' },
    { value: 'LEAD_GENERATION', label: 'Lead Generation (Form submissions)' }
  ],
  
  reach: [
    { value: 'REACH', label: 'Reach (Unique people)' },
    { value: 'IMPRESSIONS', label: 'Impressions (Total views)' }
  ]
};
```

**Recommendation:** Default to `LINK_CLICKS` for traffic objective

---

### **9. Reporting Metrics**
What metrics should you show users?

```typescript
const reportingMetrics = {
  primary: [
    { key: 'impressions', label: 'Impressions', format: 'number' },
    { key: 'reach', label: 'Reach', format: 'number' },
    { key: 'clicks', label: 'Clicks', format: 'number' },
    { key: 'spend', label: 'Spend', format: 'currency' }
  ],
  
  secondary: [
    { key: 'ctr', label: 'CTR', format: 'percentage' },
    { key: 'cpc', label: 'Cost per Click', format: 'currency' },
    { key: 'cpm', label: 'Cost per 1000 Impressions', format: 'currency' },
    { key: 'frequency', label: 'Frequency', format: 'decimal' }
  ],
  
  advanced: [
    { key: 'actions', label: 'Actions', format: 'array' },
    { key: 'conversions', label: 'Conversions', format: 'number' },
    { key: 'cost_per_conversion', label: 'Cost per Conversion', format: 'currency' }
  ]
};
```

---

### **10. User Workflow**
How should the wizard flow work?

```
Step 1: Select Promotion Type
├─ New Arrivals
├─ Sale/Clearance
├─ Featured Vehicle
└─ Custom

Step 2: Select Vehicles
├─ Browse inventory
├─ Multi-select vehicles
└─ Preview selected

Step 3: Define Audience
├─ Location (auto-detected + radius)
├─ Age range (25-55 default)
├─ Interests (automotive pre-selected)
└─ Show estimated reach

Step 4: Set Budget
├─ Daily budget slider
├─ Show estimated reach per budget
├─ Show total monthly cost
└─ Duration (ongoing default)

Step 5: Review & Launch
├─ Preview ad creative
├─ Review targeting summary
├─ Review budget summary
├─ Select ad account
├─ Select Facebook page
└─ Launch campaign button
```

---

## 🚀 Ready to Implement

You have everything you need! Here's what to do next:

### **Immediate Next Steps:**

1. **Test Audience Insights**
   ```bash
   # Visit your local dev server
   # POST to /api/facebook/audience-insights with test data
   ```

2. **Create Test Campaign**
   ```bash
   # POST to /api/facebook/create-campaign with minimal budget
   # Verify it appears in Facebook Ads Manager
   ```

3. **Integrate with Wizard**
   - Add ad account selection to Step 1
   - Add real-time audience insights to Step 2
   - Add budget recommendations to Step 3
   - Add campaign creation to Step 5

4. **Build Campaign Dashboard**
   - Create `/marketing/campaigns` page
   - Show all user campaigns
   - Link to individual campaign insights

---

## 📋 Decision Checklist

Before implementing, decide on:

- [ ] Which campaign objectives to support
- [ ] Default budget recommendations
- [ ] Default targeting (radius, age, interests)
- [ ] Ad copy generation strategy
- [ ] Campaign naming convention
- [ ] Placement strategy (automatic vs manual)
- [ ] Which metrics to show in dashboard
- [ ] Campaign approval workflow (auto-launch vs review)

---

**You're ready to build! 🎯**
