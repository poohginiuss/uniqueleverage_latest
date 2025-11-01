import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Verifier Agent - Validates SQL results match user intent
 * 
 * This agent compares the user's original question, the generated SQL,
 * and the database results to ensure everything matches correctly.
 */
export async function verifyResults(originalQuestion: string, intent: any, sql: string, dbResults: any[]) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a Dealer Data Verifier. You check if SQL results match the user's intent.

YOUR JOB:
1. Compare the user's question with the SQL query
2. Check if the database results make sense
3. Identify any mismatches or errors
4. Suggest fixes if needed

VERIFICATION CRITERIA:
- Does the SQL query address the user's question?
- Are the results the right type (count vs list vs distinct)?
- Do the numbers make sense?
- Are the filters applied correctly?
- Is the context maintained from previous questions?

OUTPUT FORMAT:
{
  "valid": true/false,
  "confidence": 0.0-1.0,
  "issues": ["issue1", "issue2"],
  "summary": "Brief explanation of verification",
  "suggested_fix": "SQL query if fix needed",
  "result_type": "count|list|distinct|aggregate",
  "expected_vs_actual": "What was expected vs what was returned"
}

EXAMPLES:

Question: "how many hondas do we have?"
SQL: "SELECT COUNT(*) FROM vehicles WHERE make = 'Honda'"
Results: [{"COUNT(*)": 15}]
Verification: {"valid": true, "confidence": 1.0, "result_type": "count"}

Question: "how many hondas do we have?"
SQL: "SELECT * FROM vehicles WHERE make = 'Honda'"
Results: [15 vehicle objects]
Verification: {"valid": false, "confidence": 0.3, "issues": ["Wrong query type - should be COUNT not SELECT *"], "suggested_fix": "SELECT COUNT(*) FROM vehicles WHERE make = 'Honda'"}

Question: "show me hondas"
SQL: "SELECT * FROM vehicles WHERE make = 'Honda'"
Results: [15 vehicle objects]
Verification: {"valid": true, "confidence": 1.0, "result_type": "list"}

Question: "what types of jeeps do we have?"
SQL: "SELECT DISTINCT body_style FROM vehicles WHERE make = 'Jeep'"
Results: [{"body_style": "SUV"}, {"body_style": "TRUCK"}]
Verification: {"valid": true, "confidence": 1.0, "result_type": "distinct"}

Respond with ONLY valid JSON, no explanations.`
        },
        {
          role: "user",
          content: `Question: "${originalQuestion}"
Intent: ${JSON.stringify(intent)}
SQL: "${sql}"
Results: ${JSON.stringify(dbResults.slice(0, 5))}

Verify:`
        }
      ],
      temperature: 0.1,
      max_tokens: 300
    });

    const response = completion.choices[0].message.content?.trim();
    
    let verification;
    try {
      verification = JSON.parse(response || '{}');
    } catch (error) {
      console.error('Failed to parse verification JSON:', response);
      verification = {
        valid: true,
        confidence: 0.5,
        issues: [],
        summary: "Could not parse verification response",
        result_type: "unknown"
      };
    }

    return {
      ...verification,
      original_question: originalQuestion,
      sql: sql,
      result_count: dbResults.length,
      verified_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('Verifier Error:', error);
    return {
      valid: true,
      confidence: 0.5,
      issues: [`Verification error: ${error instanceof Error ? error.message : String(error)}`],
      summary: "Verification failed due to error",
      result_type: "unknown",
      original_question: originalQuestion,
      sql: sql,
      result_count: dbResults.length,
      verified_at: new Date().toISOString()
    };
  }
}

/**
 * Helper function to detect result type from SQL and results
 */
export function detectResultType(sql: string, results: any[]) {
  const upperSQL = sql.toUpperCase();
  
  if (upperSQL.includes('COUNT(') || upperSQL.includes('COUNT(*)')) {
    return 'count';
  }
  
  if (upperSQL.includes('DISTINCT')) {
    return 'distinct';
  }
  
  if (upperSQL.includes('AVG(') || upperSQL.includes('SUM(') || upperSQL.includes('MIN(') || upperSQL.includes('MAX(')) {
    return 'aggregate';
  }
  
  if (results.length === 1 && results[0] && Object.keys(results[0]).length === 1) {
    const key = Object.keys(results[0])[0];
    if (key.includes('COUNT') || key.includes('AVG') || key.includes('SUM') || key.includes('MIN') || key.includes('MAX')) {
      return 'aggregate';
    }
  }
  
  return 'list';
}

/**
 * Helper function to check if SQL matches intent
 */
export function checkSQLIntentMatch(intent: any, sql: string) {
  const issues = [];
  
  // Check task type
  if (intent.task === 'count' && !sql.toUpperCase().includes('COUNT(')) {
    issues.push('Intent asks for count but SQL does not use COUNT()');
  }
  
  if (intent.task === 'list' && sql.toUpperCase().includes('COUNT(')) {
    issues.push('Intent asks for list but SQL uses COUNT()');
  }
  
  if (intent.task === 'distinct' && !sql.toUpperCase().includes('DISTINCT')) {
    issues.push('Intent asks for distinct values but SQL does not use DISTINCT');
  }
  
  // Check filters
  for (const filter of intent.filters) {
    const { field, operator, value } = filter;
    
    if (operator === '=' && !sql.includes(`${field} = '${value}'`)) {
      issues.push(`Missing filter: ${field} = '${value}'`);
    }
    
    if (operator === '<' && !sql.includes(`${field} < ${value}`)) {
      issues.push(`Missing filter: ${field} < ${value}`);
    }
  }
  
  // Check limit
  if (intent.limit && intent.limit < 100 && !sql.toUpperCase().includes('LIMIT')) {
    issues.push(`Missing LIMIT ${intent.limit}`);
  }
  
  return {
    valid: issues.length === 0,
    issues: issues
  };
}

/**
 * Helper function to validate result count makes sense
 */
export function validateResultCount(intent: any, resultCount: number) {
  const issues = [];
  
  // For count queries, should return exactly 1 row
  if (intent.task === 'count' && resultCount !== 1) {
    issues.push(`Count query should return 1 row, got ${resultCount}`);
  }
  
  // For list queries, should return multiple rows (unless filtered to 0)
  if (intent.task === 'list' && resultCount === 0 && intent.filters.length === 0) {
    issues.push('List query with no filters returned 0 rows - check data');
  }
  
  // Check if limit was respected
  if (intent.limit && resultCount > intent.limit) {
    issues.push(`Result count (${resultCount}) exceeds limit (${intent.limit})`);
  }
  
  return {
    valid: issues.length === 0,
    issues: issues
  };
}
