import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/mysql";

export async function GET() {
  try {
    // Test database connection
    const result = await executeQuery('SELECT 1 as test') as any[];
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      testResult: result[0]
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      success: false,
      message: "Database connection failed"
    }, { status: 500 });
  }
}
