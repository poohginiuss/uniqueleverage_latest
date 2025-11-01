import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { AdWizardState } from './adWizard';

interface ConversationSession {
  id: string;
  customerId: number;
  title: string;
  createdAt: Date;
  lastUpdated: Date;
  isActive: boolean;
}

interface ConversationMessage {
  id: number;
  sessionId: string;
  customerId: number;
  role: 'user' | 'assistant';
  content: string;
  metadata?: string;
  createdAt: Date;
}

interface WizardStateRecord {
  sessionId: string;
  customerId: number;
  step: number;
  adType?: string;
  selectedVehicle?: string;
  budget?: string;
  targeting?: string;
  adCopy?: string;
  isComplete: boolean;
  isPreviewMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class ConversationService {
  private connection: mysql.Connection | null = null;

  constructor() {
    // Connection will be established when needed
  }

  // Safe JSON parsing with fallback
  private safeJsonParse(jsonString: string | null, fallback: any): any {
    if (!jsonString) return fallback;
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('Failed to parse JSON:', jsonString, error);
      return fallback;
    }
  }

  private async getConnection(): Promise<mysql.Connection> {
    // Always create a new connection to avoid closed connection issues
    return await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'uniqueleverage_main',
      port: parseInt(process.env.DB_PORT || '3306')
    });
  }

      // Create a new conversation session
      async createSession(customerId: number, title: string = 'New Chat'): Promise<string> {
        const sessionId = uuidv4();
        const conn = await this.getConnection();

        try {
          await conn.execute(
            `INSERT INTO conversation_sessions (id, customer_id, title, created_at, last_updated, is_active)
             VALUES (?, ?, ?, NOW(), NOW(), 1)`,
            [sessionId, customerId, title]
          );

          console.log(`✅ Created new session: ${sessionId} for customer: ${customerId} with title: ${title}`);
          return sessionId;
        } finally {
          await conn.end();
        }
      }

  // Get active session for customer
  async getActiveSession(customerId: number): Promise<string | null> {
    const conn = await this.getConnection();
    
    try {
      const [rows] = await conn.execute(
        `SELECT id FROM conversation_sessions 
         WHERE customer_id = ? AND is_active = 1 
         ORDER BY last_updated DESC LIMIT 1`,
        [customerId]
      );

      const session = rows as any[];
      return session.length > 0 ? session[0].id : null;
    } finally {
      await conn.end();
    }
  }

      // Get or create session
      async getOrCreateSession(customerId: number, title?: string): Promise<string> {
        let sessionId = await this.getActiveSession(customerId);

        if (!sessionId) {
          sessionId = await this.createSession(customerId, title || 'New Chat');
        }

        return sessionId;
      }

      // Get all conversations for a customer
      async getAllConversations(customerId: number): Promise<ConversationSession[]> {
        const conn = await this.getConnection();

        try {
          const [rows] = await conn.execute(
            `SELECT id, customer_id, title, created_at, last_updated, is_active
             FROM conversation_sessions
             WHERE customer_id = ? AND is_active = 1
             ORDER BY last_updated DESC`,
            [customerId]
          );

          const conversations = rows as any[];
          
          return conversations.map(conv => ({
            id: conv.id,
            customerId: conv.customer_id,
            title: conv.title || 'New Chat',
            createdAt: new Date(conv.created_at),
            lastUpdated: new Date(conv.last_updated),
            isActive: Boolean(conv.is_active)
          }));
        } finally {
          await conn.end();
        }
      }

      // Generate conversation title using AI with streaming
      async generateConversationTitle(firstMessage: string, onToken?: (token: string) => void): Promise<string> {
        try {
          const OpenAI = require('openai');
          const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

          const prompt = `Given the following user message, generate a concise, descriptive title for the conversation (3-8 words max). Focus on the main topic or intent.

User message: "${firstMessage}"

Examples:
- "How many Fords do we have?" → "Ford Inventory Count"
- "I want to create a Facebook ad" → "Facebook Ad Creation"
- "Show me SUVs under $25K" → "SUV Search Under $25K"
- "What's the cheapest truck?" → "Cheapest Truck Search"
- "Tell me about our Honda inventory" → "Honda Inventory Overview"

Title:`;

          const stream = await client.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 20,
            stream: true
          });

          let fullTitle = '';
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullTitle += content;
              if (onToken) {
                onToken(content);
              }
            }
          }

          // Clean up the title (remove quotes, extra spaces, etc.)
          const cleanTitle = fullTitle.replace(/['"]/g, '').trim();
          return cleanTitle || 'New Chat';
        } catch (error) {
          console.error('Error generating conversation title:', error);
          // Fallback to a simple title based on first few words
          const words = firstMessage.split(' ').slice(0, 4);
          return words.join(' ') + (firstMessage.split(' ').length > 4 ? '...' : '');
        }
      }

      // Update conversation title
      async updateConversationTitle(sessionId: string, title: string): Promise<void> {
        const conn = await this.getConnection();

        try {
          await conn.execute(
            `UPDATE conversation_sessions SET title = ?, last_updated = NOW() WHERE id = ?`,
            [title, sessionId]
          );
        } finally {
          await conn.end();
        }
      }

  // Add message to conversation
  async addMessage(
    sessionId: string, 
    customerId: number,
    role: 'user' | 'assistant', 
    content: string, 
    metadata?: any
  ): Promise<void> {
    const conn = await this.getConnection();
    
    try {
      await conn.execute(
        `INSERT INTO conversation_messages (session_id, customer_id, role, content, metadata, created_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [sessionId, customerId, role, content, metadata ? JSON.stringify(metadata) : null]
      );

      // Update session last_updated
      await conn.execute(
        `UPDATE conversation_sessions SET last_updated = NOW() WHERE id = ?`,
        [sessionId]
      );
    } finally {
      await conn.end();
    }
  }

  // Get conversation history
  async getConversationHistory(sessionId: string, limit: number = 50): Promise<ConversationMessage[]> {
    const conn = await this.getConnection();
    
    try {
      const [rows] = await conn.execute(
        `SELECT id, session_id, customer_id, role, content, metadata, created_at 
         FROM conversation_messages 
         WHERE session_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [sessionId, limit]
      );

      const messages = rows as any[];
      return messages.reverse().map(msg => ({
        id: msg.id,
        sessionId: msg.session_id,
        customerId: msg.customer_id,
        role: msg.role,
        content: msg.content,
        metadata: msg.metadata ? JSON.parse(msg.metadata) : undefined,
        createdAt: new Date(msg.created_at)
      }));
    } finally {
      await conn.end();
    }
  }

  // Save wizard state
  async saveWizardState(sessionId: string, customerId: number, wizardState: AdWizardState): Promise<void> {
    const conn = await this.getConnection();
    
    try {
      await conn.execute(
        `INSERT INTO wizard_states 
         (session_id, customer_id, step, ad_type, selected_vehicle, budget, targeting, ad_copy, 
          is_complete, is_preview_mode, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()) 
         ON DUPLICATE KEY UPDATE 
         step = VALUES(step), 
         ad_type = VALUES(ad_type), 
         selected_vehicle = VALUES(selected_vehicle), 
         budget = VALUES(budget), 
         targeting = VALUES(targeting), 
         ad_copy = VALUES(ad_copy), 
         is_complete = VALUES(is_complete), 
         is_preview_mode = VALUES(is_preview_mode), 
         updated_at = NOW()`,
        [
          sessionId, 
          customerId, 
          wizardState.step, 
          wizardState.adType, 
          wizardState.selectedVehicle ? JSON.stringify(wizardState.selectedVehicle) : null, 
          JSON.stringify(wizardState.budget), 
          JSON.stringify(wizardState.targeting), 
          JSON.stringify(wizardState.adCopy), 
          wizardState.isComplete ? 1 : 0, 
          wizardState.isPreviewMode ? 1 : 0
        ]
      );
    } finally {
      await conn.end();
    }
  }

  // Load wizard state
  async loadWizardState(sessionId: string): Promise<AdWizardState | null> {
    const conn = await this.getConnection();
    
    try {
      const [rows] = await conn.execute(
        `SELECT step, ad_type, selected_vehicle, budget, targeting, ad_copy, 
                is_complete, is_preview_mode 
         FROM wizard_states 
         WHERE session_id = ?`,
        [sessionId]
      );

      const states = rows as any[];
      if (states.length === 0) return null;

      const state = states[0];
      return {
        step: state.step,
        adType: state.ad_type,
        selectedVehicle: state.selected_vehicle ? JSON.parse(state.selected_vehicle) : null,
        budget: this.safeJsonParse(state.budget, { amount: null, type: null }),
        targeting: this.safeJsonParse(state.targeting, { ageRange: null, locations: null, interests: null }),
        adCopy: this.safeJsonParse(state.ad_copy, { headline: null, primaryText: null, description: null, callToAction: null, destination: null }),
        isComplete: Boolean(state.is_complete),
        isPreviewMode: Boolean(state.is_preview_mode)
      };
    } finally {
      await conn.end();
    }
  }

  // Close session
  async closeSession(sessionId: string): Promise<void> {
    const conn = await this.getConnection();
    
    await conn.execute(
      `UPDATE conversation_sessions SET is_active = 0 WHERE id = ?`,
      [sessionId]
    );
  }

  // Completely delete a conversation and all related data
  async deleteConversationCompletely(sessionId: string): Promise<void> {
    const conn = await this.getConnection();
    
    try {
      // Start transaction to ensure all deletions succeed or none do
      await conn.execute('START TRANSACTION');
      
      // Delete all messages for this conversation
      await conn.execute(
        `DELETE FROM conversation_messages WHERE session_id = ?`,
        [sessionId]
      );
      
      // Delete wizard state for this conversation (if it exists)
      // Note: user_marketing_wizard uses user_id, not session_id
      // We'll skip this for now since the table structure doesn't match
      // await conn.execute(
      //   `DELETE FROM user_marketing_wizard WHERE session_id = ?`,
      //   [sessionId]
      // );
      
      // Delete the session record itself
      await conn.execute(
        `DELETE FROM conversation_sessions WHERE id = ?`,
        [sessionId]
      );
      
      // Commit the transaction
      await conn.execute('COMMIT');
      
      console.log(`✅ Completely deleted conversation ${sessionId} and all related data`);
    } catch (error) {
      // Rollback on error
      await conn.execute('ROLLBACK');
      console.error(`❌ Failed to delete conversation ${sessionId}:`, error);
      throw error;
    } finally {
      await conn.end();
    }
  }

  // Clean up old sessions (optional)
  async cleanupOldSessions(daysOld: number = 30): Promise<void> {
    const conn = await this.getConnection();
    
    await conn.execute(
      `UPDATE conversation_sessions 
       SET is_active = 0 
       WHERE last_updated < DATE_SUB(NOW(), INTERVAL ? DAY) AND is_active = 1`,
      [daysOld]
    );
  }
}

export const conversationService = new ConversationService();
