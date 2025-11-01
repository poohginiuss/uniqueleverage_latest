import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Answer Composer Agent - Formats database results into dealer-friendly responses
 * 
 * This agent takes the verified results and creates natural, helpful responses
 * that dealers can understand and act on.
 */
export async function composeAnswer(originalQuestion: string, intent: any, sql: string, dbResults: any[], verification: any) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a Dealer Answer Composer. You format database results into natural, helpful responses.

DEALER CONTEXT:
- You work with car dealerships
- Users are dealers, sales managers, inventory managers
- Responses should be professional, accurate, and actionable
- Use dealer terminology: "units", "inventory", "lot", "stock numbers"

RESPONSE TYPES:
1. COUNT responses: "We have X vehicles matching your criteria."
2. LIST responses: "Here are the X vehicles in our inventory:" (then show cards)
3. DISTINCT responses: "We have X different types: [list]"
4. AGGREGATE responses: "The average price is $X" or "Total value is $X"

RESPONSE FORMAT:
{
  "answer": "Natural language response",
  "answer_type": "count|list|distinct|aggregate",
  "data_count": number,
  "summary": "Brief summary of what was found",
  "next_actions": ["action1", "action2"],
  "evidence": "Key data points that support the answer"
}

EXAMPLES:

Question: "how many hondas do we have?"
Results: [{"COUNT(*)": 15}]
Response: {
  "answer": "We have 15 Honda vehicles in our inventory.",
  "answer_type": "count",
  "data_count": 15,
  "summary": "15 Honda vehicles found",
  "next_actions": ["Show me the Hondas", "What models do we have?"],
  "evidence": "COUNT query returned 15 Honda vehicles"
}

Question: "show me our hondas"
Results: [15 vehicle objects]
Response: {
  "answer": "Here are the 15 Honda vehicles in our inventory:",
  "answer_type": "list",
  "data_count": 15,
  "summary": "15 Honda vehicles displayed",
  "next_actions": ["Filter by price", "Sort by mileage", "Export to CSV"],
  "evidence": "15 Honda vehicles found and displayed"
}

Question: "what types of jeeps do we have?"
Results: [{"body_style": "SUV"}, {"body_style": "TRUCK"}]
Response: {
  "answer": "We have 2 different types of Jeeps: SUV and TRUCK.",
  "answer_type": "distinct",
  "data_count": 2,
  "summary": "2 Jeep body styles found",
  "next_actions": ["Show me the SUVs", "Show me the trucks"],
  "evidence": "DISTINCT query found SUV and TRUCK body styles"
}

Question: "what's the average price of our vehicles?"
Results: [{"AVG(price_cents)": 25000}]
Response: {
  "answer": "The average price of our vehicles is $25,000.",
  "answer_type": "aggregate",
  "data_count": 1,
  "summary": "Average price calculated",
  "next_actions": ["Show me vehicles under average", "Show me vehicles over average"],
  "evidence": "AVG query calculated $25,000 average price"
}

RULES:
- Be accurate and specific
- Use dealer-friendly language
- Provide actionable next steps
- Include evidence for transparency
- Keep responses concise but informative

Respond with ONLY valid JSON, no explanations.`
        },
        {
          role: "user",
          content: `Question: "${originalQuestion}"
Intent: ${JSON.stringify(intent)}
SQL: "${sql}"
Results: ${JSON.stringify(dbResults.slice(0, 3))}
Verification: ${JSON.stringify(verification)}

Compose answer:`
        }
      ],
      temperature: 0.3,
      max_tokens: 400
    });

    const response = completion.choices[0].message.content?.trim();
    
    let answer;
    try {
      answer = JSON.parse(response || '{}');
    } catch (error) {
      console.error('Failed to parse answer JSON:', response);
      answer = {
        answer: "I found the information you requested.",
        answer_type: "list",
        data_count: dbResults.length,
        summary: "Results found",
        next_actions: [],
        evidence: "Database query executed successfully"
      };
    }

    return {
      ...answer,
      original_question: originalQuestion,
      sql: sql,
      verification: verification,
      composed_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('Answer Composer Error:', error);
    return {
      answer: "I found the information you requested.",
      answer_type: "list",
      data_count: dbResults.length,
      summary: "Results found",
      next_actions: [],
      evidence: "Database query executed successfully",
      original_question: originalQuestion,
      sql: sql,
      verification: verification,
      composed_at: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Helper function to format price values
 */
export function formatPrice(priceCents: any) {
  if (typeof priceCents === 'number') {
    return `$${(priceCents / 100).toLocaleString()}`;
  }
  return priceCents;
}

/**
 * Helper function to format mileage values
 */
export function formatMileage(mileage: any) {
  if (typeof mileage === 'number') {
    return `${mileage.toLocaleString()} miles`;
  }
  return mileage;
}

/**
 * Helper function to generate next actions based on result type
 */
export function generateNextActions(answerType: string, filters: string[] = []) {
  const baseActions = {
    count: [
      "Show me these vehicles",
      "Filter by price range",
      "Sort by different criteria"
    ],
    list: [
      "Filter by price range",
      "Sort by mileage",
      "Export to CSV",
      "Create ad campaign"
    ],
    distinct: [
      "Show me vehicles of this type",
      "Compare different types",
      "Filter by specific type"
    ],
    aggregate: [
      "Show me vehicles above average",
      "Show me vehicles below average",
      "Compare with other metrics"
    ]
  };

  return (baseActions as { [key: string]: string[] })[answerType] || [];
}

/**
 * Helper function to create evidence summary
 */
export function createEvidence(intent: any, sql: string, results: any[]) {
  const evidence = [];
  
  if (intent.task === 'count') {
    const count = results[0] ? Object.values(results[0])[0] : 0;
    evidence.push(`COUNT query returned ${count} vehicles`);
  }
  
  if (intent.task === 'list') {
    evidence.push(`${results.length} vehicles found and displayed`);
  }
  
  if (intent.task === 'distinct') {
    const values = results.map(r => Object.values(r)[0]).join(', ');
    evidence.push(`DISTINCT query found: ${values}`);
  }
  
  if (intent.task === 'aggregate') {
    const value = results[0] ? Object.values(results[0])[0] : 0;
    evidence.push(`Aggregate query calculated: ${value}`);
  }
  
  if (intent.filters.length > 0) {
    const filterDesc = intent.filters.map((f: any) => `${f.field} ${f.operator} ${f.value}`).join(', ');
    evidence.push(`Filters applied: ${filterDesc}`);
  }
  
  return evidence.join('; ');
}
