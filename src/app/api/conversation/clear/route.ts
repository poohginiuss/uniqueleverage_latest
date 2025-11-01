import { NextRequest, NextResponse } from 'next/server';
import { conversationService } from '@/lib/conversationService';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = parseInt(searchParams.get('customerId') || '1');

    // Get all conversations for this customer
    const conversations = await conversationService.getAllConversations(customerId);
    
    // Close all active sessions
    for (const conversation of conversations) {
      await conversationService.closeSession(conversation.id);
    }

    console.log(`🧹 Cleared ${conversations.length} conversations for customer ${customerId}`);

    return NextResponse.json({
      message: `Cleared ${conversations.length} conversations`,
      clearedCount: conversations.length
    });

  } catch (error: any) {
    console.error('❌ Error clearing conversations:', error);
    return NextResponse.json(
      { error: 'Failed to clear conversations', details: error.message },
      { status: 500 }
    );
  }
}




