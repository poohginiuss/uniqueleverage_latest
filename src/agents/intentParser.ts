import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Intent Parser Agent - Understands dealer questions and outputs structured JSON
 * 
 * This agent analyzes natural language questions and determines:
 * - What the user wants to know (count, list, compare, etc.)
 * - What filters to apply (make, model, price, etc.)
 * - What aggregations to perform (average, sum, etc.)
 * - How to sort and limit results
 */
export async function parseIntent(question: string, conversationHistory: any[] = []) {
  try {
    // Build context from conversation history
    const contextPrompt = conversationHistory.length > 0 
      ? `\n\nPrevious conversation:\n${conversationHistory.map((msg: any, i: number) => `${i + 1}. User: "${msg.question}"\n   AI: "${msg.answer}"`).join('\n\n')}

IMPORTANT: If the current question is "show me" or similar, extract the exact criteria from the previous question to show those specific vehicles.`
      : '';

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a Dealer Intent Parser. You analyze questions about vehicle inventory and output structured JSON.

DEALER CONTEXT:
- You work with car dealerships
- Users ask about inventory (makes, models, prices, features)
- Common questions: counts, comparisons, filtering, specific vehicles
- Dealer language: "units", "inventory", "lot", "stock numbers", "days on lot"

SCHEMA COLUMNS AVAILABLE:
- stock_number, vin, year, make, model, trim, body_style
- price_cents, mileage, drivetrain, fuel_type
- exterior_color, interior_color, transmission, vehicle_type
- days_on_lot, description, location, website, updated_at

OUTPUT FORMAT:
{
  "task": "count|list|compare|aggregate|distinct",
  "filters": [
    {"field": "make", "operator": "=", "value": "Honda"},
    {"field": "price_cents", "operator": "<", "value": 30000}
  ],
  "aggregates": [
    {"function": "COUNT", "field": "*"},
    {"function": "AVG", "field": "price_cents"}
  ],
  "sort": [
    {"field": "price_cents", "direction": "ASC"}
  ],
  "limit": 10,
  "needs_semantic": false,
  "context_maintained": true
}

RULES:
- "how many" = task: "count", aggregates: [{"function": "COUNT", "field": "*"}]
- "show me" = task: "list", no aggregates
- "what types/styles" = task: "distinct", aggregates: [{"function": "DISTINCT", "field": "body_style"}]
- "average price" = task: "aggregate", aggregates: [{"function": "AVG", "field": "price_cents"}]
- "under $30k" = filters: [{"field": "price_cents", "operator": "<", "value": 30000}]
- "black vehicles" = filters: [{"field": "exterior_color", "operator": "=", "value": "Black"}]
- "SUVs" = filters: [{"field": "body_style", "operator": "=", "value": "SUV"}]
- "Hondas" = filters: [{"field": "make", "operator": "=", "value": "Honda"}]

CONTEXT HANDLING:
- If previous question was "how many hondas" and current is "show me" → use Honda filters
- If previous question was "black explorers" and current is "show me" → use Ford + Explorer + Black filters
- Always maintain context from previous questions

Respond with ONLY valid JSON, no explanations.`
        },
        {
          role: "user",
          content: `Question: "${question}"${contextPrompt}\n\nParse intent:`
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    });

    const response = completion.choices[0].message.content?.trim();
    
    // Parse the JSON response
    let intent;
    try {
      intent = JSON.parse(response || '{}');
    } catch (error) {
      console.error('Failed to parse intent JSON:', response);
      // Fallback to basic intent
      intent = {
        task: "list",
        filters: [],
        aggregates: [],
        sort: [],
        limit: 10,
        needs_semantic: false,
        context_maintained: false
      };
    }

    // Validate and normalize the intent
    return {
      task: intent.task || "list",
      filters: intent.filters || [],
      aggregates: intent.aggregates || [],
      sort: intent.sort || [],
      limit: intent.limit || 10,
      needs_semantic: intent.needs_semantic || false,
      context_maintained: intent.context_maintained || false,
      original_question: question
    };

  } catch (error) {
    console.error('Intent Parser Error:', error);
    // Fallback intent
    return {
      task: "list",
      filters: [],
      aggregates: [],
      sort: [],
      limit: 10,
      needs_semantic: false,
      context_maintained: false,
      original_question: question,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Helper function to extract vehicle type from question
 */
export function extractVehicleType(question: string) {
  const vehicleTypes = {
    'suv': ['suv', 'suvs'],
    'truck': ['truck', 'trucks', 'pickup'],
    'sedan': ['sedan', 'sedans'],
    'coupe': ['coupe', 'coupes'],
    'convertible': ['convertible', 'convertibles'],
    'hatchback': ['hatchback', 'hatchbacks'],
    'wagon': ['wagon', 'wagons'],
    'motorcycle': ['motorcycle', 'motorcycles', 'bike', 'bikes']
  };

  const lowerQuestion = question.toLowerCase();
  
  for (const [type, keywords] of Object.entries(vehicleTypes)) {
    if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
      return type.toUpperCase();
    }
  }
  
  return null;
}

/**
 * Helper function to extract make from question
 */
export function extractMake(question: string) {
  const makes = [
    'Honda', 'Toyota', 'Ford', 'Chevrolet', 'BMW', 'Mercedes', 'Audi', 'Lexus',
    'Nissan', 'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Volkswagen', 'Jeep', 'Ram',
    'Dodge', 'Chrysler', 'Cadillac', 'Lincoln', 'Acura', 'Infiniti', 'Genesis',
    'Harley-Davidson', 'Yamaha', 'Kawasaki', 'Suzuki'
  ];

  const lowerQuestion = question.toLowerCase();
  
  for (const make of makes) {
    if (lowerQuestion.includes(make.toLowerCase())) {
      return make;
    }
  }
  
  return null;
}
