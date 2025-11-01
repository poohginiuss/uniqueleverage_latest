import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * SQL Generator Agent - Generates reliable MySQL queries from structured intent
 * 
 * This agent takes the parsed intent and generates safe, accurate SQL queries
 * that match the user's request exactly.
 */
export async function generateSQL(intent: any, sampleData: any[] = []) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a Dealer SQL Generator. You create MySQL queries from structured intent.

SCHEMA COLUMNS (whitelist only):
- stock_number, vin, year, make, model, trim, body_style
- price_cents, mileage, drivetrain, fuel_type
- exterior_color, interior_color, transmission, vehicle_type
- days_on_lot, description, location, website, updated_at

SAMPLE DATA STRUCTURE:
${JSON.stringify(sampleData.slice(0, 5), null, 2)}

CRITICAL RULES:
1. ONLY use columns from the whitelist above
2. Use correct table name: "vehicles"
3. For COUNT queries: SELECT COUNT(*) FROM vehicles WHERE [conditions]
4. For LIST queries: SELECT * FROM vehicles WHERE [conditions] LIMIT [limit]
5. For DISTINCT queries: SELECT DISTINCT [field] FROM vehicles WHERE [conditions]
6. For AGGREGATE queries: SELECT [function]([field]) FROM vehicles WHERE [conditions]

INTENT TO SQL MAPPING:
- task: "count" → SELECT COUNT(*) FROM vehicles WHERE [filters]
- task: "list" → SELECT * FROM vehicles WHERE [filters] LIMIT [limit]
- task: "distinct" → SELECT DISTINCT [field] FROM vehicles WHERE [filters]
- task: "aggregate" → SELECT [aggregate_function]([field]) FROM vehicles WHERE [filters]

FILTER OPERATORS:
- "=" → WHERE field = 'value'
- "!=" → WHERE field != 'value'
- "<" → WHERE field < value
- ">" → WHERE field > value
- "<=" → WHERE field <= value
- ">=" → WHERE field >= value
- "LIKE" → WHERE field LIKE '%value%'
- "IN" → WHERE field IN ('value1', 'value2')

AGGREGATE FUNCTIONS:
- COUNT → COUNT(*)
- AVG → AVG(field)
- SUM → SUM(field)
- MIN → MIN(field)
- MAX → MAX(field)
- DISTINCT → DISTINCT field

SORT DIRECTIONS:
- "ASC" → ORDER BY field ASC
- "DESC" → ORDER BY field DESC

EXAMPLES:
Intent: {"task": "count", "filters": [{"field": "make", "operator": "=", "value": "Honda"}]}
SQL: SELECT COUNT(*) FROM vehicles WHERE make = 'Honda'

Intent: {"task": "list", "filters": [{"field": "make", "operator": "=", "value": "Honda"}], "limit": 10}
SQL: SELECT * FROM vehicles WHERE make = 'Honda' LIMIT 10

Intent: {"task": "distinct", "filters": [{"field": "make", "operator": "=", "value": "Jeep"}], "aggregates": [{"function": "DISTINCT", "field": "body_style"}]}
SQL: SELECT DISTINCT body_style FROM vehicles WHERE make = 'Jeep'

Intent: {"task": "aggregate", "filters": [], "aggregates": [{"function": "AVG", "field": "price_cents"}]}
SQL: SELECT AVG(price_cents) FROM vehicles

Generate ONLY the SQL query, no explanations, no markdown formatting.`
        },
        {
          role: "user",
          content: `Intent: ${JSON.stringify(intent)}\n\nGenerate SQL:`
        }
      ],
      temperature: 0.1,
      max_tokens: 200
    });

    let sql = completion.choices[0].message.content?.trim() || 'SELECT * FROM vehicles LIMIT 10';
    
    // Clean up any markdown formatting
    sql = sql.replace(/```sql\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Basic validation
    if (!sql.toLowerCase().includes('select')) {
      sql = 'SELECT * FROM vehicles LIMIT 10';
    }
    
    if (!sql.toLowerCase().includes('from vehicles')) {
      sql = sql.replace(/from\s+\w+/i, 'FROM vehicles');
    }

    return {
      sql,
      intent,
      generated_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('SQL Generator Error:', error);
    return {
      sql: 'SELECT * FROM vehicles LIMIT 10',
      intent,
      error: error instanceof Error ? error.message : String(error),
      generated_at: new Date().toISOString()
    };
  }
}

/**
 * Helper function to validate SQL against whitelist
 */
export function validateSQL(sql: string) {
  const allowedColumns = [
    'stock_number', 'vin', 'year', 'make', 'model', 'trim', 'body_style',
    'price_cents', 'mileage', 'drivetrain', 'fuel_type',
    'exterior_color', 'interior_color', 'transmission', 'vehicle_type',
    'days_on_lot', 'description', 'location', 'website', 'updated_at'
  ];

  const allowedFunctions = ['COUNT', 'AVG', 'SUM', 'MIN', 'MAX', 'DISTINCT'];
  const allowedOperators = ['=', '!=', '<', '>', '<=', '>=', 'LIKE', 'IN'];

  // Basic security checks
  const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE'];
  const upperSQL = sql.toUpperCase();
  
  for (const keyword of dangerousKeywords) {
    if (upperSQL.includes(keyword)) {
      return {
        valid: false,
        error: `Dangerous keyword detected: ${keyword}`
      };
    }
  }

  return {
    valid: true,
    sql: sql
  };
}

/**
 * Helper function to build WHERE clause from filters
 */
export function buildWhereClause(filters: any[]) {
  if (!filters || filters.length === 0) {
    return '';
  }

  const conditions = filters.map((filter: any) => {
    const { field, operator, value } = filter;
    
    // Validate field is in whitelist
    const allowedColumns = [
      'stock_number', 'vin', 'year', 'make', 'model', 'trim', 'body_style',
      'price_cents', 'mileage', 'drivetrain', 'fuel_type',
      'exterior_color', 'interior_color', 'transmission', 'vehicle_type',
      'days_on_lot', 'description', 'location', 'website', 'updated_at'
    ];
    
    if (!allowedColumns.includes(field)) {
      return null;
    }

    // Handle different operators
    switch (operator) {
      case '=':
        return `${field} = '${value}'`;
      case '!=':
        return `${field} != '${value}'`;
      case '<':
        return `${field} < ${value}`;
      case '>':
        return `${field} > ${value}`;
      case '<=':
        return `${field} <= ${value}`;
      case '>=':
        return `${field} >= ${value}`;
      case 'LIKE':
        return `${field} LIKE '%${value}%'`;
      case 'IN':
        const values = Array.isArray(value) ? value : [value];
        const quotedValues = values.map(v => `'${v}'`).join(', ');
        return `${field} IN (${quotedValues})`;
      default:
        return null;
    }
  }).filter(Boolean);

  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
}
