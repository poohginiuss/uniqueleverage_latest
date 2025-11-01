import { NextResponse } from "next/server";
import crypto from "crypto";

// Encryption function (same as in callback)
function encrypt(text: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const keyBuffer = key.includes('=') ? Buffer.from(key, 'base64') : Buffer.from(key, 'hex');
  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Decryption function (same as in social-media API)
function decrypt(encryptedText: string, key: string): string {
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const keyBuffer = key.includes('=') ? Buffer.from(key, 'base64') : Buffer.from(key, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
  let decrypted = decipher.update(encrypted, 'utf8', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function GET() {
  try {
    const encryptionKey = process.env.ENCRYPTION_KEY!;
    const testText = "test_token_12345";
    
    // Test encryption
    const encrypted = encrypt(testText, encryptionKey);
    
    // Test decryption
    const decrypted = decrypt(encrypted, encryptionKey);
    
    return NextResponse.json({
      success: true,
      test: {
        original: testText,
        encrypted: encrypted,
        decrypted: decrypted,
        matches: testText === decrypted,
        keyLength: encryptionKey.length,
        keyPreview: encryptionKey.substring(0, 10) + "..."
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
}