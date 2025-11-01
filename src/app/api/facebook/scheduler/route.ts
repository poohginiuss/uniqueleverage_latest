import { NextResponse } from "next/server";

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Call the test-connection endpoint
    const response = await fetch(`${baseUrl}/api/facebook/test-connection`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "Daily Facebook API test completed successfully",
        timestamp: new Date().toISOString(),
        result: result
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Daily Facebook API test failed",
        timestamp: new Date().toISOString(),
        error: result.error
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error in scheduler:", error);
    return NextResponse.json({
      success: false,
      message: "Scheduler error",
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 });
  }
}
