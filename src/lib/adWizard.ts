export interface AdWizardState {
  step: number;
  adType: 'single' | 'carousel' | null;
  selectedVehicle: any | null;
  budget: {
    amount: number | null;
    type: 'daily' | 'lifetime' | null;
  };
  targeting: {
    ageRange: string | null;
    locations: string[] | null;
    interests: string[] | null;
  };
  adCopy: {
    headline: string | null;
    primaryText: string | null;
    description: string | null;
    callToAction: string | null;
    destination: 'VSP' | 'Messenger' | 'Website' | null;
  };
  isComplete: boolean;
  isPreviewMode: boolean;
}

export const AD_WIZARD_STEPS = {
  AD_TYPE: 1,
  VEHICLE_SELECTION: 2,
  BUDGET: 3,
  TARGETING_AGE: 4,
  TARGETING_LOCATIONS: 5,
  TARGETING_INTERESTS: 6,
  HEADLINE: 7,
  PRIMARY_TEXT: 8,
  DESCRIPTION: 9,
  CALL_TO_ACTION: 10,
  DESTINATION: 11,
  PREVIEW: 12,
  COMPLETE: 13
} as const;

export const STEP_QUESTIONS = {
  [AD_WIZARD_STEPS.AD_TYPE]: "What type of ad would you like to create - a single vehicle ad or a carousel ad?",
  [AD_WIZARD_STEPS.VEHICLE_SELECTION]: "Please search for the vehicle you'd like to feature in your ad. You can type the make, model, year, stock number, or any details to find it.",
  [AD_WIZARD_STEPS.BUDGET]: "What's your total budget for this campaign? Please specify if it's a daily budget or lifetime budget (e.g., '$50 daily' or '$500 lifetime').",
  [AD_WIZARD_STEPS.TARGETING_AGE]: "What age range should we target? (e.g., '25-65')",
  [AD_WIZARD_STEPS.TARGETING_LOCATIONS]: "Which locations should we target? You can say states, cities, or zip codes (e.g., 'Wisconsin, Illinois' or 'Milwaukee, Chicago').",
  [AD_WIZARD_STEPS.TARGETING_INTERESTS]: "What automotive interests should we target? (e.g., 'Ford, Honda, SUVs, Trucks')",
  [AD_WIZARD_STEPS.HEADLINE]: "What headline would you like for your ad?",
  [AD_WIZARD_STEPS.PRIMARY_TEXT]: "What's the main message you want to convey in your ad?",
  [AD_WIZARD_STEPS.DESCRIPTION]: "What additional description would you like to include?",
  [AD_WIZARD_STEPS.CALL_TO_ACTION]: "What call-to-action button would you like? (e.g., 'Learn More', 'Get Quote', 'Contact Us')",
  [AD_WIZARD_STEPS.DESTINATION]: "Where should we send people who click your ad? (VSP, Messenger, or Website)",
  [AD_WIZARD_STEPS.PREVIEW]: "Here's a preview of your ad. Would you like to make any changes or launch it?",
  [AD_WIZARD_STEPS.COMPLETE]: "Your ad has been created successfully!"
} as const;

export function getNextStep(currentStep: number, userResponse: string, wizardState: AdWizardState): number {
  switch (currentStep) {
    case AD_WIZARD_STEPS.AD_TYPE:
      if (userResponse.toLowerCase().includes('single')) {
        return AD_WIZARD_STEPS.VEHICLE_SELECTION;
      } else if (userResponse.toLowerCase().includes('carousel')) {
        return AD_WIZARD_STEPS.VEHICLE_SELECTION;
      }
      return currentStep; // Stay on same step if invalid response

    case AD_WIZARD_STEPS.VEHICLE_SELECTION:
      // This step is handled by vehicle card clicks, not text responses
      return AD_WIZARD_STEPS.BUDGET;

    case AD_WIZARD_STEPS.BUDGET:
      if (userResponse.match(/\$\d+/)) {
        return AD_WIZARD_STEPS.TARGETING_AGE;
      }
      return currentStep;

    case AD_WIZARD_STEPS.TARGETING_AGE:
      if (userResponse.match(/\d+-\d+/)) {
        return AD_WIZARD_STEPS.TARGETING_LOCATIONS;
      }
      return currentStep;

    case AD_WIZARD_STEPS.TARGETING_LOCATIONS:
      if (userResponse.trim().length > 0) {
        return AD_WIZARD_STEPS.TARGETING_INTERESTS;
      }
      return currentStep;

    case AD_WIZARD_STEPS.TARGETING_INTERESTS:
      if (userResponse.trim().length > 0) {
        return AD_WIZARD_STEPS.HEADLINE;
      }
      return currentStep;

    case AD_WIZARD_STEPS.HEADLINE:
      if (userResponse.trim().length > 0) {
        return AD_WIZARD_STEPS.PRIMARY_TEXT;
      }
      return currentStep;

    case AD_WIZARD_STEPS.PRIMARY_TEXT:
      if (userResponse.trim().length > 0) {
        return AD_WIZARD_STEPS.DESCRIPTION;
      }
      return currentStep;

    case AD_WIZARD_STEPS.DESCRIPTION:
      if (userResponse.trim().length > 0) {
        return AD_WIZARD_STEPS.CALL_TO_ACTION;
      }
      return currentStep;

    case AD_WIZARD_STEPS.CALL_TO_ACTION:
      if (userResponse.trim().length > 0) {
        return AD_WIZARD_STEPS.DESTINATION;
      }
      return currentStep;

    case AD_WIZARD_STEPS.DESTINATION:
      if (userResponse.toLowerCase().includes('vsp') || 
          userResponse.toLowerCase().includes('messenger') || 
          userResponse.toLowerCase().includes('website')) {
        return AD_WIZARD_STEPS.PREVIEW;
      }
      return currentStep;

    case AD_WIZARD_STEPS.PREVIEW:
      if (userResponse.toLowerCase().includes('launch') || 
          userResponse.toLowerCase().includes('yes') || 
          userResponse.toLowerCase().includes('create')) {
        return AD_WIZARD_STEPS.COMPLETE;
      }
      return currentStep;

    default:
      return currentStep;
  }
}

export function parseUserResponse(step: number, userResponse: string, wizardState: AdWizardState): Partial<AdWizardState> {
  const updates: Partial<AdWizardState> = {};

  switch (step) {
    case AD_WIZARD_STEPS.AD_TYPE:
      if (userResponse.toLowerCase().includes('single')) {
        updates.adType = 'single';
      } else if (userResponse.toLowerCase().includes('carousel')) {
        updates.adType = 'carousel';
      }
      break;

    case AD_WIZARD_STEPS.BUDGET:
      const budgetMatch = userResponse.match(/\$(\d+)/);
      if (budgetMatch) {
        updates.budget = {
          amount: parseInt(budgetMatch[1]),
          type: userResponse.toLowerCase().includes('daily') ? 'daily' : 'lifetime'
        };
      }
      break;

    case AD_WIZARD_STEPS.TARGETING_AGE:
      updates.targeting = {
        ...wizardState.targeting,
        ageRange: userResponse.trim()
      };
      break;

    case AD_WIZARD_STEPS.TARGETING_LOCATIONS:
      updates.targeting = {
        ...wizardState.targeting,
        locations: userResponse.split(',').map(loc => loc.trim())
      };
      break;

    case AD_WIZARD_STEPS.TARGETING_INTERESTS:
      updates.targeting = {
        ...wizardState.targeting,
        interests: userResponse.split(',').map(interest => interest.trim())
      };
      break;

    case AD_WIZARD_STEPS.HEADLINE:
      updates.adCopy = {
        ...wizardState.adCopy,
        headline: userResponse.trim()
      };
      break;

    case AD_WIZARD_STEPS.PRIMARY_TEXT:
      updates.adCopy = {
        ...wizardState.adCopy,
        primaryText: userResponse.trim()
      };
      break;

    case AD_WIZARD_STEPS.DESCRIPTION:
      updates.adCopy = {
        ...wizardState.adCopy,
        description: userResponse.trim()
      };
      break;

    case AD_WIZARD_STEPS.CALL_TO_ACTION:
      updates.adCopy = {
        ...wizardState.adCopy,
        callToAction: userResponse.trim()
      };
      break;

    case AD_WIZARD_STEPS.DESTINATION:
      if (userResponse.toLowerCase().includes('vsp')) {
        updates.adCopy = { ...wizardState.adCopy, destination: 'VSP' };
      } else if (userResponse.toLowerCase().includes('messenger')) {
        updates.adCopy = { ...wizardState.adCopy, destination: 'Messenger' };
      } else if (userResponse.toLowerCase().includes('website')) {
        updates.adCopy = { ...wizardState.adCopy, destination: 'Website' };
      }
      break;
  }

  return updates;
}

export function generateAdPreview(wizardState: AdWizardState): string {
  if (!wizardState.selectedVehicle) return '';

  const vehicle = wizardState.selectedVehicle;
  const budget = wizardState.budget;
  const targeting = wizardState.targeting;
  const adCopy = wizardState.adCopy;

  return `
🎯 **AD PREVIEW**

**Vehicle:** ${vehicle.year || ''} ${vehicle.make} ${vehicle.model} (${vehicle.stock_number})
**Price:** $${vehicle.price ? parseFloat(vehicle.price).toLocaleString() : 'N/A'}
**Mileage:** ${vehicle.mileage_value ? vehicle.mileage_value.toLocaleString() : 'N/A'} ${vehicle.mileage_unit || 'MI'}

**Budget:** $${budget.amount} ${budget.type}
**Targeting:** Ages ${targeting.ageRange}, ${targeting.locations?.join(', ')}, Interests: ${targeting.interests?.join(', ')}

**Ad Copy:**
**Headline:** ${adCopy.headline}
**Primary Text:** ${adCopy.primaryText}
**Description:** ${adCopy.description}
**Call to Action:** ${adCopy.callToAction}
**Destination:** ${adCopy.destination}

**Campaign:** Website Conversions / Ad Wizard
**Ad Set:** ${vehicle.make} ${vehicle.model}
**Ad:** ${adCopy.headline}

Ready to launch this ad?
  `.trim();
}




