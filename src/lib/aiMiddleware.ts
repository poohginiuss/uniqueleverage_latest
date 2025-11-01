import OpenAI from "openai";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { 
  AdWizardState, 
  AD_WIZARD_STEPS, 
  STEP_QUESTIONS, 
  getNextStep, 
  parseUserResponse, 
  generateAdPreview 
} from './adWizard';
import { conversationService } from './conversationService';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function askInventoryQuestion(question: string, conversationHistory: any[] = [], sessionId?: string, customerId: number = 1): Promise<any> {
  try {
    console.log(`🔍 Processing question: "${question}"`);

    // Get or create session for this customer
    const currentSessionId = sessionId || await conversationService.getOrCreateSession(customerId);
    
    // Load wizard state for this session
    let wizardState = await conversationService.loadWizardState(currentSessionId) || {
      step: 0,
      adType: null,
      selectedVehicle: null,
      budget: { amount: null, type: null },
      targeting: { ageRange: null, locations: null, interests: null },
      adCopy: { headline: null, primaryText: null, description: null, callToAction: null, destination: null },
      isComplete: false,
      isPreviewMode: false
    };

    // Check if this is a vehicle card click during ad creation (MUST be first!)
    if (question.includes("I want to create a Facebook ad for this specific vehicle:")) {
      return handleVehicleSelection(question, conversationHistory, wizardState, currentSessionId, customerId);
    }

    // Check if this is a wizard step response FIRST (before vehicle search)
    const wizardStep = detectWizardStep(question, conversationHistory, wizardState);
    if (wizardStep > 0) {
      return handleWizardStep(question, wizardStep, conversationHistory, wizardState, currentSessionId, customerId);
    }
    
    // Check if this is a vehicle search during ad creation
    const isInWizardFlow = wizardState && wizardState.step > 0 && !wizardState.isComplete;
    
    // If in wizard flow, let AI handle it (includes typo correction)
    // This will go to handleGeneralQuestion which uses AI for better results

    // Check if this is an ad creation request (general)
    if (question.includes("Create a Facebook ad campaign")) {
      return handleAdCreation(question, conversationHistory, wizardState, currentSessionId, customerId);
    }

    // Check if this is a preview demo request
    if (question.includes("Show me the ad preview demo")) {
      return handlePreviewDemo();
    }

    // Default to general conversation or database search
    return handleGeneralQuestion(question, conversationHistory, wizardState, currentSessionId, customerId);

  } catch (error: any) {
    console.error("❌ Error in askInventoryQuestion:", error);
    throw new Error(`Failed to process question: ${error.message}`);
  }
}

function handleAdCreation(question: string, conversationHistory: any[], wizardState: any, sessionId: string, customerId: number): any {
  // Reset wizard state and start from step 1
  const newWizardState = {
    step: AD_WIZARD_STEPS.AD_TYPE,
    adType: null,
    selectedVehicle: null,
    budget: { amount: null, type: null },
    targeting: { ageRange: null, locations: null, interests: null },
    adCopy: { headline: null, primaryText: null, description: null, callToAction: null, destination: null },
    isComplete: false,
    isPreviewMode: false
  };

  // Save wizard state to database
  conversationService.saveWizardState(sessionId, customerId, newWizardState);

  return {
    answer: "Great! Let's create your Facebook ad. Would you like to create a single vehicle ad or a carousel ad with multiple vehicles?",
    sql: "N/A - Ad creation wizard",
    rowCount: 0,
    data: []
  };
}

function handlePreviewDemo(): any {
  // Set up a demo wizard state with sample data
  const demoWizardState = {
    step: AD_WIZARD_STEPS.PREVIEW,
    adType: 'single',
    selectedVehicle: {
      id: 270,
      title: '2011 Ford Explorer XLT Sport Utility 4D',
      year: 2011,
      make: 'Ford',
      model: 'Explorer',
      trim: 'XLT Sport Utility 4D',
      body_style: 'SUV',
      price: '11999',
      mileage_value: 122719,
      mileage_unit: 'MI',
      exterior_color: 'Black',
      stock_number: 'PA51344',
      images: ['https://via.placeholder.com/400x300/cccccc/666666?text=Ford+Explorer']
    },
    budget: { amount: 50, type: 'daily' },
    targeting: { 
      ageRange: '25-55', 
      locations: ['Milwaukee', 'Chicago'], 
      interests: ['Ford', 'SUVs', 'Automotive'] 
    },
    adCopy: {
      headline: 'Amazing Ford Explorer Deal!',
      primaryText: 'Don\'t miss this incredible 2011 Ford Explorer XLT. Low miles, great condition, and an unbeatable price!',
      description: 'Perfect family SUV with all the features you need. Call today!',
      callToAction: 'Learn More',
      destination: 'VSP'
    },
    isComplete: true,
    isPreviewMode: true
  };

  return {
    answer: "Here's a preview of how your Facebook ad will look!",
    sql: "N/A - Preview demo",
    rowCount: 0,
    data: [],
    showPreview: true,
    previewData: {
      vehicle: demoWizardState.selectedVehicle,
      adType: demoWizardState.adType,
      budget: demoWizardState.budget,
      targeting: demoWizardState.targeting,
      adCopy: demoWizardState.adCopy
    }
  };
}

function isVehicleSearchDuringAdCreation(question: string, conversationHistory: any[], wizardState: any): boolean {
  // Check if user is in ad creation flow and searching for vehicles
  const hasAdCreationContext = conversationHistory.some(msg => 
    msg.content?.toLowerCase().includes('create') && 
    msg.content?.toLowerCase().includes('ad')
  );
  
  const isVehicleSearch = !question.includes('I want to create') && 
                         !question.includes('specific vehicle') &&
                         (question.length < 50 && /^[a-zA-Z\s]+$/.test(question.trim()));

  return hasAdCreationContext && isVehicleSearch && wizardState && wizardState.step === AD_WIZARD_STEPS.VEHICLE_SELECTION;
}

async function handleVehicleSearch(question: string, conversationHistory: any[], wizardState: any, currentSessionId: string, customerId: number): Promise<any> {
  // Fast deterministic search using pattern matching
  const searchTerms = question.toLowerCase().trim().split(/\s+/);
  
  // Try to identify model, make, color, and body style from the search terms
  let modelMatch = '';
  let makeMatch = '';
  let colorMatch = '';
  let bodyStyleMatch = '';
  
  // Color keywords
  const colors = ['red', 'blue', 'black', 'white', 'silver', 'gray', 'grey', 'green', 'yellow', 'orange', 'purple', 'brown', 'tan', 'beige', 'gold', 'bronze', 'maroon', 'burgundy', 'navy'];
  
  for (const term of searchTerms) {
    if (colors.includes(term)) {
      colorMatch = term;
    } else if (['suv', 'sedan', 'coupe', 'truck', 'hatchback', 'wagon', 'van', 'convertible'].includes(term)) {
      bodyStyleMatch = term;
    } else {
      // Assume it's a model/make
      if (!modelMatch) {
        modelMatch = term;
      } else if (!makeMatch) {
        makeMatch = term;
      }
    }
  }
  
  // Build SQL query
  let sql = 'SELECT * FROM inventory WHERE ';
  const conditions: string[] = [];
  
  if (modelMatch) {
    conditions.push(`LOWER(model) LIKE '%${modelMatch}%'`);
  }
  if (makeMatch) {
    conditions.push(`LOWER(make) LIKE '%${makeMatch}%'`);
  }
  if (colorMatch) {
    conditions.push(`LOWER(exterior_color) LIKE '%${colorMatch}%'`);
  }
  if (bodyStyleMatch) {
    conditions.push(`LOWER(body_style) LIKE '%${bodyStyleMatch}%'`);
  }
  
  // If no specific matches, search broadly
  if (conditions.length === 0) {
    sql += `(LOWER(model) LIKE '%${searchTerms[0]}%' OR LOWER(make) LIKE '%${searchTerms[0]}%')`;
  } else {
    sql += conditions.join(' AND ');
  }
  
  sql += ' LIMIT 20';
  
  try {
    const dbPath = path.join(process.cwd(), 'data', 'AutoplexMKE.db');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    const vehicles = await db.all(sql);
    await db.close();
    
    // Map fields for frontend
    const mappedVehicles = vehicles.map((v: any) => {
      // Handle images - could be JSON array, single URL string, or already an array
      let images = [];
      if (v.images) {
        if (Array.isArray(v.images)) {
          images = v.images;
        } else if (typeof v.images === 'string') {
          // Try to parse as JSON first
          try {
            const parsed = JSON.parse(v.images);
            images = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            // If JSON parse fails, treat as single URL string
            images = [v.images];
          }
        }
      }
      
      return {
        stock_number: v.stock_number || '',
        year: v.year || '',
        make: v.make || '',
        model: v.model || '',
        trim: v.trim || '',
        color: v.exterior_color || v.color || '',
        bodyStyle: v.body_style || v.bodyStyle || '',
        mileage: v.mileage_value || v.mileage || 0,
        price: v.price || 0,
        images: images,
        description: v.description || ''
      };
    });
    
    console.log(`✅ Fast vehicle search completed: ${mappedVehicles.length} vehicles found`);
    console.log(`📦 First vehicle data:`, mappedVehicles[0]);
    
    // Check if we're in a wizard flow - if so, include wizardStep to maintain wizard context
    const inWizard = wizardState && wizardState.step > 0 && !wizardState.isComplete;
    const wizardStepData = inWizard ? {
      step: wizardState.step,
      question: (STEP_QUESTIONS as any)[wizardState.step] || '',
      wizardState: wizardState
    } : undefined;
    
    return {
      answer: `I found ${mappedVehicles.length} vehicles matching "${question}":`,
      sql: sql,
      rowCount: mappedVehicles.length,
      data: mappedVehicles,
      searchResults: mappedVehicles,
      wizardStep: wizardStepData // Include wizard context to show buttons
    };
  } catch (error) {
    console.error('❌ Vehicle search error:', error);
    return {
      answer: "I encountered an error searching for vehicles. Please try again.",
      sql: "ERROR",
      rowCount: 0,
      data: []
    };
  }
}

function handleVehicleSelection(question: string, conversationHistory: any[], wizardState: any, currentSessionId: string, customerId: number): any {
  console.log("🚗 Vehicle selection detected");
  console.log("📝 Conversation history:", conversationHistory);
  
  // Extract vehicle info from the message
  const vehicleMatch = question.match(/I want to create a Facebook ad for this specific vehicle:\s*(.+?)\s*\(([^)]+)\)/);
  
  if (vehicleMatch) {
    const vehicleName = vehicleMatch[1].trim();
    const stockNumber = vehicleMatch[2].trim();
    
    console.log(`🔍 Looking for vehicle: ${vehicleName} (${stockNumber})`);
    
    // Check if user has already answered ad type in conversation history
    const hasAnsweredAdType = conversationHistory.some(msg => 
      msg.content?.toLowerCase().includes('single') || 
      msg.content?.toLowerCase().includes('carousel')
    );
    
    console.log(`✅ Has answered ad type: ${hasAnsweredAdType}`);
    
    // Find the vehicle in the database
    return findVehicleByStockNumber(stockNumber).then(vehicle => {
      if (vehicle) {
        wizardState.selectedVehicle = vehicle;
        
        if (hasAnsweredAdType) {
          // User already answered ad type, skip to budget
          wizardState.step = AD_WIZARD_STEPS.BUDGET;
          console.log("💰 Skipping to budget question");
          return {
            answer: STEP_QUESTIONS[AD_WIZARD_STEPS.BUDGET],
            sql: "N/A - Vehicle selected, skipping to budget",
            rowCount: 0,
            data: []
          };
        } else {
          // User hasn't answered ad type yet, ask for it
          wizardState.step = AD_WIZARD_STEPS.AD_TYPE;
          console.log("❓ Asking for ad type");
          return {
            answer: STEP_QUESTIONS[AD_WIZARD_STEPS.AD_TYPE],
            sql: "N/A - Vehicle selected, asking ad type",
            rowCount: 0,
            data: []
          };
        }
      } else {
        return {
          answer: "I couldn't find that vehicle. Please try searching again.",
          sql: "N/A - Vehicle not found",
          rowCount: 0,
          data: []
        };
      }
    });
  }

  return {
    answer: "Please select a vehicle from the search results.",
    sql: "N/A - Invalid vehicle selection",
    rowCount: 0,
    data: []
  };
}

function detectWizardStep(question: string, conversationHistory: any[], wizardState: any): number {
  // Only detect wizard steps if the question seems like a response to wizard questions
  // Check if user is answering ad type question
  if (question.toLowerCase().includes('single') || question.toLowerCase().includes('carousel')) {
    return AD_WIZARD_STEPS.AD_TYPE;
  }
  
  // Check if user is providing budget information
  if (question.toLowerCase().includes('$') || question.toLowerCase().includes('budget') || 
      question.toLowerCase().includes('daily') || question.toLowerCase().includes('lifetime')) {
    return AD_WIZARD_STEPS.BUDGET;
  }
  
  // Check if user is providing age range
  if (question.match(/\d+-\d+/) || question.toLowerCase().includes('age')) {
    return AD_WIZARD_STEPS.TARGETING_AGE;
  }
  
  // Check if user is providing location information
  if (question.toLowerCase().includes('wisconsin') || question.toLowerCase().includes('illinois') || 
      question.toLowerCase().includes('milwaukee') || question.toLowerCase().includes('chicago') ||
      question.toLowerCase().includes('location')) {
    return AD_WIZARD_STEPS.TARGETING_LOCATIONS;
  }
  
  // Check if user is providing interests (only if explicitly mentioning interests)
  if (question.toLowerCase().includes('interest')) {
    return AD_WIZARD_STEPS.TARGETING_INTERESTS;
  }
  
  // Check if user is providing ad copy
  if (question.length > 20 && !question.toLowerCase().includes('hello') && 
      !question.toLowerCase().includes('hi') && !question.toLowerCase().includes('how')) {
    // This could be headline, primary text, description, or CTA
    if (wizardState.step === AD_WIZARD_STEPS.HEADLINE) return AD_WIZARD_STEPS.HEADLINE;
    if (wizardState.step === AD_WIZARD_STEPS.PRIMARY_TEXT) return AD_WIZARD_STEPS.PRIMARY_TEXT;
    if (wizardState.step === AD_WIZARD_STEPS.DESCRIPTION) return AD_WIZARD_STEPS.DESCRIPTION;
    if (wizardState.step === AD_WIZARD_STEPS.CALL_TO_ACTION) return AD_WIZARD_STEPS.CALL_TO_ACTION;
    if (wizardState.step === AD_WIZARD_STEPS.DESTINATION) return AD_WIZARD_STEPS.DESTINATION;
  }
  
  return 0; // Not a wizard step response
}

function handleWizardStep(question: string, step: number, conversationHistory: any[], wizardState: any, sessionId: string, customerId: number): any {
  // Parse the user's response
  const updates = parseUserResponse(step, question, wizardState);
  
  // Update wizard state
  Object.assign(wizardState, updates);
  
  // Save updated wizard state to database
  conversationService.saveWizardState(sessionId, customerId, wizardState);
  
  // Get next step
  const nextStep = getNextStep(step, question, wizardState);
  
  if (nextStep === step) {
    // Invalid response, stay on same step
    return {
      answer: `Please provide a valid response. ${(STEP_QUESTIONS as any)[step]}`,
      sql: "N/A - Invalid response",
      rowCount: 0,
      data: []
    };
  }
  
  wizardState.step = nextStep;
  
  // Calculate step progress - match existing ad wizard (5 steps)
  const totalSteps = 5;
  
  // Show preview for headline step and beyond (single persistent preview)
  const shouldShowPreview = nextStep >= AD_WIZARD_STEPS.HEADLINE && nextStep < AD_WIZARD_STEPS.PREVIEW;
  
  if (nextStep === AD_WIZARD_STEPS.PREVIEW) {
    // Generate ad preview
    const preview = generateAdPreview(wizardState);
    return {
      answer: `Perfect! Here's your ad preview:\n\n${preview}`,
      sql: "N/A - Ad preview",
      rowCount: 0,
      data: [],
      showPreview: true,
      previewData: {
        vehicle: wizardState.selectedVehicle,
        adType: wizardState.adType,
        budget: wizardState.budget,
        targeting: wizardState.targeting,
        adCopy: wizardState.adCopy
      }
    };
  }
  
  if (nextStep === AD_WIZARD_STEPS.COMPLETE) {
    // Create the ad
    wizardState.isComplete = true;
    return {
      answer: "🎉 Your Facebook ad has been created successfully! It's now live and running.",
      sql: "N/A - Ad created",
      rowCount: 0,
      data: []
    };
  }
  
  // Generate natural, conversational questions for each step
  let stepQuestion = '';
  switch (nextStep) {
    case AD_WIZARD_STEPS.AD_TYPE:
      stepQuestion = `Would you like to create a single vehicle ad or a carousel ad with multiple vehicles?`;
      break;
    case AD_WIZARD_STEPS.VEHICLE_SELECTION:
      stepQuestion = `Perfect! Now let's find the vehicle you want to feature. Search for a vehicle by make, model, stock number, or any details you have.`;
      break;
    case AD_WIZARD_STEPS.BUDGET:
      stepQuestion = `Set your budget (e.g., '$50 daily' or '$500 lifetime'):`;
      break;
    case AD_WIZARD_STEPS.TARGETING_AGE:
      stepQuestion = `Target age range (e.g., '25-65'):`;
      break;
    case AD_WIZARD_STEPS.TARGETING_LOCATIONS:
      stepQuestion = `Target locations (e.g., 'Wisconsin, Illinois'):`;
      break;
    case AD_WIZARD_STEPS.TARGETING_INTERESTS:
      stepQuestion = `Target interests (e.g., 'Ford, Honda, SUVs'):`;
      break;
    case AD_WIZARD_STEPS.HEADLINE:
      stepQuestion = `Enter headline:`;
      break;
    case AD_WIZARD_STEPS.PRIMARY_TEXT:
      stepQuestion = `Enter main message:`;
      break;
    case AD_WIZARD_STEPS.DESCRIPTION:
      stepQuestion = `Enter description:`;
      break;
    case AD_WIZARD_STEPS.CALL_TO_ACTION:
      stepQuestion = `Enter call to action (e.g., 'Shop Now'):`;
      break;
    case AD_WIZARD_STEPS.DESTINATION:
      stepQuestion = `Choose destination (VSP, Messenger, or Website):`;
      break;
    default:
      stepQuestion = '';
  }
  
  return {
    answer: stepQuestion,
    sql: "N/A - Wizard step",
    rowCount: 0,
    data: [],
    showPreview: shouldShowPreview,
    previewData: shouldShowPreview ? {
      vehicle: wizardState.selectedVehicle,
      adType: wizardState.adType,
      budget: wizardState.budget,
      targeting: wizardState.targeting,
      adCopy: wizardState.adCopy
    } : undefined,
    wizardStep: {
      step: nextStep,
      question: stepQuestion,
      wizardState: wizardState
    }
  };
}

async function findVehicleByStockNumber(stockNumber: string): Promise<any> {
  try {
    const dbPath = path.join(process.cwd(), 'data', 'AutoplexMKE.db');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const sql = `SELECT * FROM inventory WHERE stock_number = ?`;
    const rows = await db.all(sql, [stockNumber]);
    await db.close();

    if (rows.length > 0) {
      const vehicle = rows[0];
      return {
        ...vehicle,
        images: vehicle.images ? [vehicle.images] : [],
        price: vehicle.price || 'N/A'
      };
    }
    return null;
  } catch (error) {
    console.error('Error finding vehicle:', error);
    return null;
  }
}

async function handleGeneralQuestion(question: string, conversationHistory: any[], wizardState: any, sessionId: string, customerId: number): Promise<any> {
  try {
    // Check if we're in the middle of ad creation wizard
    const isInWizard = wizardState && wizardState.step > AD_WIZARD_STEPS.AD_TYPE && !wizardState.isComplete;
    
    if (isInWizard) {
      // Special handling for vehicle selection step - skip wizard logic
      if (wizardState.step !== AD_WIZARD_STEPS.VEHICLE_SELECTION) {
        // During wizard, check if this is an answer to current step or a natural question
        const wizardContextPrompt = `You are in the middle of a Facebook ad creation wizard. The user is currently on step ${wizardState.step}.

Current wizard state:
- Step: ${wizardState.step}
- Ad Type: ${wizardState.adType || 'not set'}
- Vehicle: ${wizardState.selectedVehicle ? 'selected' : 'not selected'}
- Budget: ${wizardState.budget.amount ? 'set' : 'not set'}

User's message: "${question}"

Determine if this message is:
1. An answer to the current wizard step (proceed to next step)
2. A natural question/request for assistance (respond conversationally)

Examples of wizard answers:
- "single vehicle ad" (when asked about ad type)
- "$50 daily" (when asked about budget)
- "25-65" (when asked about age range)
- "Wisconsin, Illinois" (when asked about locations)

Examples of natural questions during wizard:
- "What's the difference between single and carousel ads?"
- "How much should I budget for Facebook ads?"
- "What age range works best for car ads?"
- "Can you help me understand targeting?"

Respond with ONLY: "wizard_answer" or "natural_question"`;

      const contextResponse = await client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: wizardContextPrompt }],
        max_tokens: 10,
        temperature: 0.1
      });

      const contextIntent = contextResponse.choices[0]?.message?.content?.trim().toLowerCase();
      
      if (contextIntent === "natural_question") {
        // Handle as natural question during wizard - check if it's an inventory/inquiry question
        const isInventoryQuestion = question.toLowerCase().includes('how many') || 
                                   question.toLowerCase().includes('show me') ||
                                   question.toLowerCase().includes('find') ||
                                   question.toLowerCase().includes('search for') ||
                                   question.toLowerCase().includes('what') ||
                                   question.toLowerCase().includes('list');
        
        if (isInventoryQuestion) {
          // User is asking about inventory - process as regular inventory question
          // Store wizard state is preserved, user can return to it
          return handleGeneralQuestionDirect(question, conversationHistory, sessionId, customerId, wizardState);
        }
        
        // Handle as informational question during wizard
        const naturalResponse = await client.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: `You are a helpful AI assistant helping with Facebook ad creation. The user is currently on step ${wizardState.step} of the ad creation wizard. Answer their question naturally and helpfully, then offer to continue with the ad creation if appropriate.` },
            { role: "user", content: question }
          ],
          max_tokens: 300,
          temperature: 0.7
        });

        const answer = naturalResponse.choices[0]?.message?.content || "I'm here to help!";
        
        // Append wizard continuation prompt if appropriate
        const shouldPromptToContinue = wizardState.step > AD_WIZARD_STEPS.AD_TYPE;
        const wizardPrompt = shouldPromptToContinue ? "\n\nWould you like to continue with your ad creation?" : "";

        return {
          answer: answer + wizardPrompt,
          sql: "N/A - Natural question during wizard",
          rowCount: 0,
          data: [],
          preserveWizardState: true // Signal to preserve wizard state
        };
      } else {
        // Treat as wizard answer and proceed
        return handleWizardStep(question, wizardState.step, conversationHistory, wizardState, sessionId, customerId);
      }
      }
    }

    // Not in wizard - determine intent for general questions
    const decisionPrompt = `You are a helpful AI assistant. Analyze this user question and determine the intent:

Question: "${question}"
Conversation History: ${JSON.stringify(conversationHistory.slice(-3))}

Determine if this question:
1. Requires database/inventory access (vehicle searches, counts, data analysis)
2. Is a general conversation (greetings, math, jokes, general knowledge, assistance requests)

Respond with ONLY one word: "database" or "general"

Examples:
- "how many cars do we have" → database
- "what's 5+5" → general  
- "tell me a joke" → general
- "hello" → general
- "can you help me with something?" → general
- "what should I do?" → general
- "how are you?" → general
- "what's the weather?" → general`;

    const decisionResponse = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: decisionPrompt }],
      max_tokens: 10,
      temperature: 0.1
    });

    const intent = decisionResponse.choices[0]?.message?.content?.trim().toLowerCase();
    
    if (intent === "general") {
      // Handle as general conversation
      const generalResponse = await client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful AI assistant. Respond naturally and conversationally to the user's question. Be friendly and helpful. You can help with general questions, math, jokes, or provide assistance with various topics." },
          { role: "user", content: question }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      return {
        answer: generalResponse.choices[0]?.message?.content || "I'm here to help!",
        sql: "N/A - General conversation",
        rowCount: 0,
        data: []
      };
    }

    // Default to database search for inventory-related questions
    const dbPath = path.join(process.cwd(), 'data', 'AutoplexMKE.db');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const contextPrompt = conversationHistory.length > 0
      ? `\n\nCONVERSATION CONTEXT:\n${conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nUse this context to understand what the user is referring to.`
      : '';

    const prompt = `
You are a data assistant for a car dealership.
The database table is called 'inventory' with columns:
(id, title, year, make, model, trim, body_style, price, mileage_value, mileage_unit, vehicle_type, days_on_lot, exterior_color, interior_color, transmission, drivetrain, fuel_type, stock_number, description, images)

Convert the following question into a valid SQLite SQL query:
"${question}"${contextPrompt}

CRITICAL RULES - MUST FOLLOW:
- When user mentions BOTH a vehicle model/make AND a color (e.g., "red explorer", "blue truck"), you MUST use AND to combine both filters in the WHERE clause
- Use LIKE '%term%' for partial matches (e.g., "explorer" should match "Explorer")
- Use LOWER() for case-insensitive searches
- For "how many" questions, use COUNT(*)
- For "show me" questions, use SELECT * with specific filters and LIMIT
- For "most" or "highest" questions, use GROUP BY with COUNT(*) and ORDER BY DESC LIMIT 5 to detect ties
- Always use proper SQLite syntax
- ONLY OUTPUT THE RAW SQL QUERY - NO markdown, NO code blocks, NO explanations, NO backticks
- If the question is vague like "show me", use the conversation context to infer what to show
- CRITICAL: For questions asking "most" or "highest", always use LIMIT 5 (not LIMIT 1) to detect ties
- If the user says a single word that could be a vehicle make/model (like "explorer", "civic", "silverado"), search for that vehicle in both make and model fields
- ALWAYS break down compound searches: "red explorer" = model='explorer' AND color='red' - NEVER ignore parts of the search

CRITICAL FIELD SELECTION RULES:
- For vehicle TYPES (SUV, truck, sedan, coupe, etc.) → Use body_style field (NOT vehicle_type)
- For vehicle MODELS (Explorer, Silverado, Civic, etc.) → Use model field
- For vehicle MAKES (Ford, Chevrolet, Honda, etc.) → Use make field
- For COLOR searches → Use exterior_color field
- The vehicle_type field is mostly "OTHER" and not useful for classification
- The body_style field contains the actual vehicle classifications (SUV, SEDAN, COUPE, etc.)

EXAMPLES OF COMPOUND SEARCHES (LEARN FROM THESE):
- "red explorer" → SELECT * FROM inventory WHERE LOWER(model) LIKE '%explorer%' AND LOWER(exterior_color) LIKE '%red%' LIMIT 20
- "blue silverado" → SELECT * FROM inventory WHERE LOWER(model) LIKE '%silverado%' AND LOWER(exterior_color) LIKE '%blue%' LIMIT 20
- "black truck" → SELECT * FROM inventory WHERE LOWER(body_style) LIKE '%truck%' AND LOWER(exterior_color) LIKE '%black%' LIMIT 20

Examples:
- "how many explorers" → SELECT COUNT(*) FROM inventory WHERE LOWER(model) LIKE '%explorer%'
- "do we have any explorers" → SELECT COUNT(*) FROM inventory WHERE LOWER(model) LIKE '%explorer%'
- "do we have lincolns" or "do you have lincolns" → SELECT * FROM inventory WHERE LOWER(make) LIKE '%lincoln%' LIMIT 20
- "show me silverados" → SELECT * FROM inventory WHERE LOWER(model) LIKE '%silverado%' LIMIT 20
- "show me" (after asking about civics) → SELECT * FROM inventory WHERE LOWER(model) LIKE '%civic%' LIMIT 20
- "explorer" (single word) → SELECT * FROM inventory WHERE LOWER(model) LIKE '%explorer%' OR LOWER(make) LIKE '%explorer%' LIMIT 20
- "civic" (single word) → SELECT * FROM inventory WHERE LOWER(model) LIKE '%civic%' OR LOWER(make) LIKE '%civic%' LIMIT 20
- "how many SUVs" → SELECT COUNT(*) FROM inventory WHERE LOWER(body_style) LIKE '%suv%'
- "show me SUVs under $25K" → SELECT * FROM inventory WHERE LOWER(body_style) LIKE '%suv%' AND CAST(price AS INTEGER) < 25000 LIMIT 20
- "how many trucks" → SELECT COUNT(*) FROM inventory WHERE LOWER(body_style) LIKE '%truck%'
- "cheapest SUV" → SELECT * FROM inventory WHERE LOWER(body_style) LIKE '%suv%' ORDER BY CAST(price AS INTEGER) ASC LIMIT 1
- "what SUV do we have the most of" → SELECT model, COUNT(*) AS count FROM inventory WHERE LOWER(body_style) LIKE '%suv%' GROUP BY model ORDER BY count DESC LIMIT 5
- "most popular vehicle" → SELECT model, COUNT(*) AS count FROM inventory GROUP BY model ORDER BY count DESC LIMIT 5
- "which vehicle do we have the most of" → SELECT model, COUNT(*) AS count FROM inventory GROUP BY model ORDER BY count DESC LIMIT 5
`;

    const sqlResponse = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a SQL query generator for automotive inventory data. ONLY output the raw SQL query with no markdown, no code blocks, no explanations, no backticks. Just the SQL statement."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0,
      max_tokens: 200
    });

    const sql = sqlResponse.choices[0].message.content?.trim();
    if (!sql) {
      throw new Error("No SQL query generated");
    }

    console.log("🔧 Generated SQL:", sql);

    const rows = await db.all(sql);
    console.log(`📊 Query returned ${rows.length} rows`);

    const summaryPrompt = `
Given the following rows from the car inventory database, summarize the answer to the user's question:

Question: "${question}"
SQL Query: "${sql}"
Rows returned: ${rows.length}
Data: ${JSON.stringify(rows).slice(0, 4000)}

Provide a natural, conversational response.
- If the user asked for counts, give the exact number.
- If the user asked to "show me" vehicles, provide a brief summary but DO NOT list individual vehicle details in the text (the vehicle cards will display the details).
- If the user is searching for vehicles during ad creation (check conversation context), acknowledge that they're selecting a vehicle for their ad. Say something like "Perfect! Here are the vehicles that match your search. Click on any vehicle card below to select it for your ad."
- Keep responses short and conversational.
- DO NOT end responses with generic phrases like "How can I assist you further?" or "How can I help you?" 
- Only ask a follow-up question if it makes logical sense and adds value to the conversation.
- For simple factual questions (counts, math, general info), just provide the answer and stop. No follow-up questions.
- For "most" or "highest" questions, analyze the data intelligently. If there are ties, mention them.
- End responses naturally without unnecessary questions.
`;

    const summaryResponse = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful automotive inventory assistant. Provide clear, accurate answers based on the data. NEVER end responses with generic phrases like 'How can I assist you further?' or 'How can I help you?' End responses naturally."
        },
        {
          role: "user",
          content: summaryPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    });

    const answer = summaryResponse.choices[0].message.content;

    await db.close();

    // Check if this is an aggregation query (count, sum, avg, etc.)
    const isAggregationQuery = sql.toLowerCase().includes('count(*)') || 
                               sql.toLowerCase().includes('sum(') || 
                               sql.toLowerCase().includes('avg(') || 
                               sql.toLowerCase().includes('min(') || 
                               sql.toLowerCase().includes('max(');
    
    if (isAggregationQuery) {
      // For aggregation queries, return empty vehicles array since we only want the calculated result
      return {
        answer,
        sql,
        rowCount: rows.length,
        data: []
      };
    }

    const transformedVehicles = rows.map((row: any) => ({
      ...row,
      images: row.images ? [row.images] : [], // Convert string to array
      price: row.price || 'N/A', // Ensure price is always a string
      year: row.year || null,
      // Map SQLite fields to common names
      mileage: row.mileage_value || row.mileage || null,
      mileage_value: row.mileage_value || row.mileage || null,
      bodyStyle: row.body_style || row.bodyStyle || null,
      stockNumber: row.stock_number || row.stockNumber || null,
      color: row.exterior_color || row.color || null, // Map exterior_color to color
      exterior_color: row.exterior_color || null,
      transmission: row.transmission || 'AUTO'
    }));

    return {
      answer,
      sql,
      rowCount: rows.length,
      data: transformedVehicles
    };

  } catch (error: any) {
    console.error("❌ Error in handleGeneralQuestion:", error);
    throw new Error(`Failed to process question: ${error.message}`);
  }
}

async function handleGeneralQuestionDirect(question: string, conversationHistory: any[], sessionId: string, customerId: number, wizardState: any): Promise<any> {
  // Handle direct inventory/inquiry questions while preserving wizard state
  // Call handleGeneralQuestion but skip wizard checks for this direct call
  return handleGeneralQuestion(question, conversationHistory, null, sessionId, customerId);
}