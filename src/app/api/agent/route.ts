import { NextResponse } from 'next/server';

// Store conversation history in memory (in production, use Redis or database)
const conversationHistory = new Map<string, any[]>();

export async function POST(request: Request) {
  try {
    const { userRequest, context } = await request.json();
    
    console.log('🤖 AI Agent received request:', userRequest);
    console.log('📊 Context:', context);
    
    // Get or create conversation history for this session
    const sessionId = context.sessionId || 'default';
    let history = conversationHistory.get(sessionId) || [];
    
    // Use the contextual approach that maintains conversation history
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/ask-contextual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: userRequest,
        conversationHistory: history
      })
    });
    
    if (!response.ok) {
      throw new Error(`Contextual query failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Update conversation history
    history.push({
      question: userRequest,
      answer: result.answer,
      timestamp: Date.now()
    });
    
    // Keep only last 10 exchanges to prevent memory bloat
    if (history.length > 10) {
      history = history.slice(-10);
    }
    
    conversationHistory.set(sessionId, history);
    
    console.log('🧠 Contextual Response:', {
      answer: result.answer,
      queryType: result.queryType,
      dataCount: result.dataCount,
      responseTime: result.responseTime,
      historyLength: history.length,
      hasVehicles: !!result.vehicles,
      vehiclesLength: result.vehicles?.length || 0
    });
    
    return NextResponse.json({
      message: result.answer,
      actions: [], // Actions are now handled by the hybrid system internally
      success: true,
      queryType: result.queryType,
      dataCount: result.dataCount,
      responseTime: result.responseTime,
      context: result.context,
      vehicles: result.vehicles || [] // Pass through vehicle data for frontend display
    });
    
  } catch (error) {
    console.error('❌ AI Agent error:', error);
    return NextResponse.json({
      error: 'AI Agent failed',
      success: false,
      message: 'Sorry, I encountered an error. Please try again.'
    }, { status: 500 });
  }
}
