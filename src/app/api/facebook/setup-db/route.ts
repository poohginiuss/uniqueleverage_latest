import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/mysql";

export async function POST() {
  try {
    // Create the facebook_test_logs table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS facebook_test_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        run_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        campaigns_read INT,
        adsets_read INT,
        ads_read INT,
        insights_rows INT,
        test_campaign_id VARCHAR(64),
        test_adset_id VARCHAR(64),
        test_ad_id VARCHAR(64),
        status ENUM('success', 'failure') DEFAULT 'success',
        error_message TEXT
      )
    `);

    return NextResponse.json({
      success: true,
      message: "Facebook test logs table created successfully"
    });
  } catch (error: any) {
    console.error("Error creating table:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
