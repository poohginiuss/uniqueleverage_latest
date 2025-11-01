import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/mysql";

export async function GET() {
  try {
    const logs = await executeQuery(
      'SELECT * FROM facebook_test_logs ORDER BY run_at DESC LIMIT 10'
    );

    return NextResponse.json({
      success: true,
      logs: logs,
      count: Array.isArray(logs) ? logs.length : 0
    });
  } catch (error: any) {
    console.error("Error fetching logs:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
