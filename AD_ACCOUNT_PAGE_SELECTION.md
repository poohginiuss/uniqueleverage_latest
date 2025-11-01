# Ad Account & Page Selection - Updated

## ✅ How It Works Now

### **Ad Account Selection:**
- ✅ Uses the **connected ad account** from `user_ad_accounts` table
- ✅ Automatically uses the first (and only) connected account
- ✅ No need to select - it's already set in integrations

### **Page Selection:**
- ✅ Fetches all connected pages from `user_pages` table
- ✅ User **selects which page** to use in Step 5 of wizard
- ✅ Auto-selects first page by default
- ✅ User can change it before launching campaign

---

## 🎯 User Flow

### **Setup (One Time):**
1. User goes to Settings > Integrations
2. Connects Facebook (OAuth flow)
3. Selects which pages to connect
4. Selects which ad account to use
5. Data stored in database:
   - `user_integrations` - Facebook connection
   - `user_pages` - Connected pages
   - `user_ad_accounts` - Selected ad account

### **Creating Campaign (Every Time):**
1. User completes wizard Steps 1-4
2. In **Step 5**, user sees:
   - Headline input
   - Primary text input
   - Call-to-action dropdown
   - **Facebook Page selector** ⬅️ NEW!
3. User selects which page to use
4. User clicks "Launch Campaign"
5. Campaign uses:
   - ✅ Connected ad account (automatic)
   - ✅ Selected page (user choice)

---

## 📋 What Changed

### **1. Added State (Lines 309-310)**
```typescript
const [selectedPageId, setSelectedPageId] = useState<string>('');
const [availablePages, setAvailablePages] = useState<Array<{
  id: string, 
  pageId: string, 
  name: string
}>>([]);
```

### **2. Added useEffect to Fetch Pages (Lines 312-330)**
```typescript
useEffect(() => {
  const fetchUserPages = async () => {
    const response = await fetch('/api/integrations/social-media');
    const data = await response.json();
    
    if (data.connectedPages && data.connectedPages.length > 0) {
      setAvailablePages(data.connectedPages);
      // Auto-select first page
      setSelectedPageId(data.connectedPages[0].pageId);
    }
  };
  
  fetchUserPages();
}, []);
```

### **3. Updated handleLaunchCampaign (Lines 797-821)**
Now uses:
- `/api/integrations/social-media` instead of `/api/facebook/test-permissions`
- `connectedAdAccounts[0].accountId` for ad account
- `selectedPageId` for page

### **4. Added Page Selector in Step 5 (Lines 2638-2665)**
```tsx
{availablePages.length > 0 && (
  <div>
    <label>Facebook Page *</label>
    <select 
      value={selectedPageId}
      onChange={(e) => setSelectedPageId(e.target.value)}
    >
      {availablePages.map((page) => (
        <option key={page.pageId} value={page.pageId}>
          {page.name}
        </option>
      ))}
    </select>
    <p>Your ad will be published from this page</p>
  </div>
)}
```

---

## 🎨 What User Sees

### **Step 5 - Before:**
- Headline
- Primary Text
- Call to Action
- Generate Button
- Launch Campaign Button

### **Step 5 - Now:**
- Headline
- Primary Text
- Call to Action
- **Facebook Page** ⬅️ NEW! (dropdown with user's pages)
- Generate Button
- Launch Campaign Button

---

## 🔧 Technical Details

### **API: `/api/integrations/social-media`**

**Returns:**
```json
{
  "facebookProfile": {
    "name": "Nathan Allison",
    "email": "nathan@example.com"
  },
  "connectedPages": [
    {
      "id": 1,
      "pageId": "1470353646442469",
      "name": "Autoplex2",
      "category": "Car dealership",
      "platform": "facebook"
    },
    {
      "id": 2,
      "pageId": "1967231336900858",
      "name": "Autoplex",
      "category": "Car dealership",
      "platform": "facebook"
    }
  ],
  "connectedAdAccounts": [
    {
      "id": 1,
      "name": "Loyal Auto Sales Ad Account",
      "accountId": "act_41872014",
      "platform": "facebook"
    }
  ],
  "availableAdAccounts": [...]
}
```

### **Database Tables:**

**`user_ad_accounts`:**
- Stores the ONE selected ad account
- System automatically uses this for campaigns

**`user_pages`:**
- Stores all connected pages
- User selects which one to use per campaign

---

## ✅ Benefits

1. **Ad Account**: Automatic - no selection needed
2. **Page**: User choice - select per campaign
3. **Flexible**: User can have multiple pages, choose the right one
4. **Simple**: Minimal UI, clear selection
5. **Safe**: Auto-selects first page as default

---

## 🧪 Testing

### **To Test:**

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Go to wizard:**
   ```
   http://localhost:3000/marketing/wizard
   ```

3. **Check Step 5:**
   - Should see "Facebook Page" dropdown
   - Should show your connected pages
   - First page should be pre-selected

4. **Launch Campaign:**
   - Select different page if desired
   - Click "Launch Campaign"
   - Verify campaign uses correct page

---

## 📊 Error Handling

### **No Ad Account Connected:**
```
"Please connect an ad account first. 
Go to Settings > Integrations > Connect Ad Account."
```

### **No Page Selected:**
```
"Please select a Facebook page to use for this campaign."
```

### **No Pages Available:**
- Page selector won't appear
- User needs to connect pages first

---

**Perfect! Now your system:**
- ✅ Uses the connected ad account automatically
- ✅ Lets users choose which page to use
- ✅ Shows clear selection in Step 5
- ✅ Works exactly how you want it! 🚀
