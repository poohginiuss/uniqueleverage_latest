import { NextRequest, NextResponse } from 'next/server';
import { conversationService } from '@/lib/conversationService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get conversation history
    const history = await conversationService.getConversationHistory(sessionId);
    const wizardState = await conversationService.loadWizardState(sessionId);

    // Generate title from first user message if no title exists
    let title = 'Untitled Conversation';
    if (history && history.length > 0) {
      const firstUserMessage = history.find(msg => msg.role === 'user');
      if (firstUserMessage) {
        title = firstUserMessage.content.length > 50 
          ? firstUserMessage.content.substring(0, 47) + '...' 
          : firstUserMessage.content;
      }
    }

    return NextResponse.json({
      messages: history,
      wizardState,
      title,
      sessionId
    });
    
  } catch (error) {
    console.error('Error getting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to get conversation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    console.log(`🗑️ Attempting to delete conversation: ${sessionId}`);
    
    // Completely delete the conversation and all related data
    await conversationService.deleteConversationCompletely(sessionId);
    
    console.log(`✅ Successfully deleted conversation: ${sessionId}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Conversation deleted successfully' 
    });
    
  } catch (error) {
    console.error('❌ Error deleting conversation:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      sessionId: (await params).sessionId
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to delete conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
