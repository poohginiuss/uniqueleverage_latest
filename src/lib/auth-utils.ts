import { executeQuery } from '@/lib/mysql';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  username: string;
  role: string;
  dealershipName: string;
  phone?: string;
  website?: string;
  businessAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  subscriptionStatus?: string;
  subscriptionId?: string;
  customerId?: string;
  subscriptionAmount?: number;
  subscriptionProductName?: string;
  subscriptionCurrency?: string;
  verified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

/**
 * Get user data from session token
 * The session token is actually the user's email stored in the cookie
 */
export async function getUserFromSession(sessionToken: string): Promise<User | null> {
  try {
    if (!sessionToken) {
      return null;
    }

    // Query user by email (session token is the email)
    const users = await executeQuery(
      `SELECT 
        id, email, first_name, last_name, name, username, role, dealership_name, phone, website, 
        business_address, city, state, zip, 
        subscription_status, subscription_id, customer_id, 
        subscription_amount, subscription_product_name, subscription_currency,
        verified, created_at, last_login_at 
      FROM users WHERE email = ?`,
      [sessionToken]
    );

    if (!Array.isArray(users) || users.length === 0) {
      return null;
    }

    const user = users[0] as any;
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      name: user.name,
      username: user.username,
      role: user.role,
      dealershipName: user.dealership_name,
      phone: user.phone,
      website: user.website,
      businessAddress: user.business_address,
      city: user.city,
      state: user.state,
      zip: user.zip,
      subscriptionStatus: user.subscription_status,
      subscriptionId: user.subscription_id,
      customerId: user.customer_id,
      subscriptionAmount: user.subscription_amount,
      subscriptionProductName: user.subscription_product_name,
      subscriptionCurrency: user.subscription_currency,
      verified: user.verified,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at
    };
  } catch (error) {
    console.error('Error getting user from session:', error);
    return null;
  }
}

/**
 * Validate session and return authentication status
 */
export async function validateSession(): Promise<{ isAuthenticated: boolean; user?: User }> {
  try {
    // This is a placeholder implementation
    // In a real app, you'd check cookies, JWT tokens, etc.
    // For now, we'll assume sessions are managed elsewhere
    return { isAuthenticated: true };
  } catch (error) {
    console.error('Error validating session:', error);
    return { isAuthenticated: false };
  }
}

/**
 * Generate expected filename for a dealership
 */
export function generateExpectedFilename(dealershipName: string): string {
  // Remove spaces and special characters, keep only alphanumeric
  const cleanName = dealershipName.replace(/[^a-zA-Z0-9]/g, '');
  return `${cleanName}.csv`;
}