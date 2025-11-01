import { executeQuery } from './mysql';

// Verification tokens stored in MySQL database
export const verificationTokens = {
  set: async (token: string, email: string, expires: number) => {
    try {
      console.log('💾 Storing verification token in database:', { token: token.substring(0, 8) + '...', email, expires });
      await executeQuery(
        'INSERT INTO verification_tokens (token, email, expires) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE email = ?, expires = ?',
        [token, email, expires, email, expires]
      );
      console.log('✅ Verification token stored successfully');
    } catch (error) {
      console.error('❌ Error storing verification token:', error);
      throw error;
    }
  },
  
  get: async (token: string) => {
    try {
      console.log('🔍 Retrieving verification token from database:', token.substring(0, 8) + '...');
      const results = await executeQuery(
        'SELECT email, expires FROM verification_tokens WHERE token = ?',
        [token]
      );
      
      console.log('📊 Database query results:', results);
      
      if (Array.isArray(results) && results.length > 0) {
        console.log('✅ Token found in database:', results[0]);
        return results[0] as { email: string; expires: number };
      }
      console.log('❌ Token not found in database');
      return null;
    } catch (error) {
      console.error('❌ Error retrieving verification token:', error);
      return null;
    }
  },
  
  delete: async (token: string) => {
    try {
      await executeQuery(
        'DELETE FROM verification_tokens WHERE token = ?',
        [token]
      );
    } catch (error) {
      console.error('Error deleting verification token:', error);
    }
  }
};
