# Marketing Ad Wizard Playground 🎮

## Overview
This is a safe development space for experimenting with the Marketing Ad Wizard design and user flow without affecting the production version.

## How to Access

### Option 1: Direct URL
```
http://localhost:3000/marketing/wizard-playground
```

### Option 2: Via Marketing Page
1. Go to `http://localhost:3000/marketing`
2. Click the "🎮 Playground" button in the top right

## What's Different

### Visual Indicators
- **Yellow Development Banner** at the top clearly indicates this is a playground
- **Breadcrumb** shows "Ad Wizard (Playground)" instead of just "Ad Wizard"

### API Behavior
- **Playground API** (`/api/playground/create-campaign`) instead of production API
- **Campaign Names** are prefixed with `[PLAYGROUND]` 
- **All Campaigns** are automatically set to `PAUSED` status
- **Same Logic** but safe for experimentation

### Database Logging
- Playground activities are logged separately in the database
- No interference with production data

## Safe Experimentation

### ✅ What You Can Do Safely:
- Modify UI/UX design
- Change step flow and navigation
- Experiment with form layouts
- Test different component arrangements
- Try new color schemes and styling
- Add/remove form fields
- Change button placements and text

### 🔒 What's Protected:
- Production Ad Wizard remains untouched
- Production API endpoints remain unchanged
- Production database data is safe
- Production cron jobs continue running

## File Structure

```
src/app/marketing/
├── wizard/                    # Production Ad Wizard
│   └── page.tsx              # Original production version
├── wizard-playground/         # Development playground
│   └── page.tsx              # Safe copy for experimentation
└── wizard-backup/            # Backup of original
    └── page.tsx              # Backup copy

src/app/api/
├── facebook/create-campaign/ # Production API
└── playground/create-campaign/ # Playground API
```

## Workflow

1. **Make changes** in `src/app/marketing/wizard-playground/page.tsx`
2. **Test changes** at `http://localhost:3000/marketing/wizard-playground`
3. **Iterate and refine** your design changes
4. **When satisfied**, copy your changes back to the production version:
   ```bash
   cp src/app/marketing/wizard-playground/page.tsx src/app/marketing/wizard/page.tsx
   ```

## Tips for Design Experimentation

### Quick UI Changes
- Modify CSS classes in the playground file
- Change component arrangements
- Test different layouts

### Flow Changes
- Reorder steps
- Add/remove steps
- Change navigation logic

### Component Testing
- Try different form components
- Test new button styles
- Experiment with card layouts

## Rollback Safety

If you ever break the playground:
```bash
# Restore from backup
cp src/app/marketing/wizard-backup/page.tsx src/app/marketing/wizard-playground/page.tsx

# Or restore from production
cp src/app/marketing/wizard/page.tsx src/app/marketing/wizard-playground/page.tsx
```

## Happy Experimenting! 🚀

This playground gives you complete freedom to experiment with the Ad Wizard design while keeping your production system safe and running.

