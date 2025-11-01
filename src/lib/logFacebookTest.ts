import { executeQuery } from "./mysql";

export async function logFacebookTest({
  campaigns_read,
  adsets_read,
  ads_read,
  insights_rows,
  test_campaign_id,
  test_adset_id,
  test_ad_id,
  status,
  error_message,
}: {
  campaigns_read?: number;
  adsets_read?: number;
  ads_read?: number;
  insights_rows?: number;
  test_campaign_id?: string;
  test_adset_id?: string;
  test_ad_id?: string;
  status: "success" | "failure";
  error_message?: string;
}) {
  await executeQuery(
    `
    INSERT INTO facebook_test_logs
      (campaigns_read, adsets_read, ads_read, insights_rows,
       test_campaign_id, test_adset_id, test_ad_id, status, error_message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      campaigns_read || 0,
      adsets_read || 0,
      ads_read || 0,
      insights_rows || 0,
      test_campaign_id || null,
      test_adset_id || null,
      test_ad_id || null,
      status,
      error_message || null,
    ]
  );
}
