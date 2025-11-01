import { NextRequest, NextResponse } from 'next/server';
import { conversationService } from '@/lib/conversationService';
import { askInventoryQuestion } from '@/lib/aiMiddleware';

export async function POST(request: NextRequest) {
  try {
    const { question, conversationHistory = [], sessionId, customerId = 1, isNewChat = false, generateTitle = false } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    let currentSessionId = sessionId;
    
    let generatedTitle = '';
    
    // If this is a new chat, create a new session
    if (isNewChat || !sessionId) {
      // Generate an AI-powered title from the first message
      generatedTitle = await conversationService.generateConversationTitle(question);
      currentSessionId = await conversationService.createSession(customerId, generatedTitle);
    } else {
      // Get existing session
      currentSessionId = await conversationService.getOrCreateSession(customerId);
    }
    
    // Save user message to conversation
    await conversationService.addMessage(currentSessionId, customerId, 'user', question);
    
    // Process the question with session context
    const result = await askInventoryQuestion(question, conversationHistory, currentSessionId, customerId);

    // Save assistant response to conversation
    await conversationService.addMessage(currentSessionId, customerId, 'assistant', result.answer, result);

    // If this is the first message and we created a new session, update the title
    if (isNewChat && question) {
      const title = question.length > 50 ? question.substring(0, 47) + '...' : question;
      await conversationService.updateConversationTitle(currentSessionId, title);
    }

    const responseData = {
      ...result,
      response: result.answer, // Map answer to response for frontend
      searchResults: result.data || [], // Map data to searchResults for frontend
      persistentPreview: result.previewData || null, // Map previewData to persistentPreview for frontend
      wizardStep: result.wizardStep || undefined, // Include wizardStep for native UI
      sessionId: currentSessionId,
      title: generatedTitle
    };
    
    console.log(`📤 API Response - searchResults count: ${responseData.searchResults?.length || 0}`);
    if (responseData.searchResults?.length > 0) {
      console.log(`📦 First searchResult:`, responseData.searchResults[0]);
    }
    console.log(`🎯 API Response - wizardStep:`, responseData.wizardStep);
    
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('❌ Error in conversation API:', error);
    return NextResponse.json(
      { error: 'Failed to process question', details: error.message },
      { status: 500 }
    );
  }
}

// Get conversation history for a session or all conversations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const customerId = parseInt(searchParams.get('customerId') || '1');

    if (sessionId) {
      // Get specific conversation history
      const history = await conversationService.getConversationHistory(sessionId);
      const wizardState = await conversationService.loadWizardState(sessionId);

      return NextResponse.json({
        history,
        wizardState,
        sessionId
      });
    } else {
      // Get all conversations for customer
      const conversations = await conversationService.getAllConversations(customerId);
      
      return NextResponse.json({
        conversations
      });
    }

  } catch (error: any) {
    console.error('❌ Error getting conversation data:', error);
    return NextResponse.json(
      { error: 'Failed to get conversation data', details: error.message },
      { status: 500 }
    );
  }
}
