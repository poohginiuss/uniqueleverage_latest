import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/mysql";
import crypto from "crypto";

const GRAPH_API_BASE = "https://graph.facebook.com/v20.0";

// Decryption function
function decrypt(encryptedText: string, key: string): string {
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  
  let keyBuffer: Buffer;
  try {
    keyBuffer = Buffer.from(key, 'base64');
  } catch {
    const base64Key = Buffer.from(key, 'utf8').toString('base64');
    keyBuffer = Buffer.from(base64Key, 'base64');
  }
  
  if (keyBuffer.length !== 32) {
    keyBuffer = crypto.createHash('sha256').update(keyBuffer).digest();
  }
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function GET() {
  try {
    console.log('🕐 Starting Facebook Daily Activity Cron Job...');
    
    // Get all users with Facebook integrations
    const integrations = await executeQuery(
      'SELECT id, user_id, access_token FROM user_integrations WHERE provider = ? AND integration_type = ? AND status = ?',
      ['facebook', 'advertising', 'active']
    ) as any[];

    if (!integrations || integrations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No Facebook integrations found for daily activity',
        activities: []
      });
    }

    const activities = [];
    const encryptionKey = process.env.ENCRYPTION_KEY!;

    for (const integration of integrations) {
      try {
        console.log(`🔄 Processing user ${integration.user_id}...`);
        
        // Decrypt access token
        const accessToken = decrypt(integration.access_token, encryptionKey);
        
        // Get the connected ad account for this user
        const adAccounts = await executeQuery(
          'SELECT ad_account_id FROM user_ad_accounts WHERE user_id = ? AND integration_id = ?',
          [integration.user_id, integration.id]
        ) as any[];
        
        if (!adAccounts || adAccounts.length === 0) {
          console.log(`⚠️ No connected ad account for user ${integration.user_id}`);
          continue;
        }
        
        const adAccountId = adAccounts[0].ad_account_id;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Activity 1: Fetch account insights (multiple times for more API activity)
        const insightsActivities = [
          { date_preset: 'yesterday', name: 'Yesterday Insights' },
          { date_preset: 'last_7d', name: 'Last 7 Days Insights' },
          { date_preset: 'last_30d', name: 'Last 30 Days Insights' },
          { date_preset: 'this_month', name: 'This Month Insights' },
          { date_preset: 'last_month', name: 'Last Month Insights' }
        ];
        
        for (const insightActivity of insightsActivities) {
          try {
            const insightsResponse = await fetch(
              `${GRAPH_API_BASE}/act_${adAccountId}/insights?fields=impressions,clicks,spend,reach,frequency&date_preset=${insightActivity.date_preset}&access_token=${accessToken}`
            );
            
            const insightsResult = await insightsResponse.json();
            
            if (insightsResponse.ok) {
              console.log(`✅ ${insightActivity.name} fetched for user ${integration.user_id}`);
              activities.push({
                user_id: integration.user_id,
                activity: 'insights_fetched',
                type: insightActivity.name,
                data_points: insightsResult.data?.length || 0,
                status: 'success'
              });
            } else {
              console.log(`⚠️ ${insightActivity.name} fetch failed for user ${integration.user_id}:`, insightsResult.error?.message);
              activities.push({
                user_id: integration.user_id,
                activity: 'insights_fetch_failed',
                type: insightActivity.name,
                error: insightsResult.error?.message,
                status: 'failed'
              });
            }
            
            // Small delay between API calls
            await new Promise(resolve => setTimeout(resolve, 500));
            
          } catch (error) {
            console.log(`❌ ${insightActivity.name} fetch error for user ${integration.user_id}:`, error);
            activities.push({
              user_id: integration.user_id,
              activity: 'insights_fetch_error',
              type: insightActivity.name,
              error: error instanceof Error ? error.message : String(error),
              status: 'error'
            });
          }
        }
        
        // Activity 2: Fetch account information (multiple endpoints)
        const accountEndpoints = [
          { endpoint: 'adaccounts', name: 'Ad Accounts' },
          { endpoint: 'campaigns?fields=id,name,status', name: 'Campaigns List' },
          { endpoint: 'adsets?fields=id,name,status', name: 'Ad Sets List' },
          { endpoint: 'ads?fields=id,name,status', name: 'Ads List' },
          { endpoint: 'adcreatives?fields=id,name,status', name: 'Creatives List' }
        ];
        
        for (const endpointInfo of accountEndpoints) {
          try {
            const endpointResponse = await fetch(
              `${GRAPH_API_BASE}/act_${adAccountId}/${endpointInfo.endpoint}&access_token=${accessToken}`
            );
            
            const endpointResult = await endpointResponse.json();
            
            if (endpointResponse.ok) {
              console.log(`✅ ${endpointInfo.name} fetched for user ${integration.user_id}`);
              activities.push({
                user_id: integration.user_id,
                activity: 'endpoint_fetched',
                endpoint: endpointInfo.name,
                data_points: endpointResult.data?.length || 0,
                status: 'success'
              });
            } else {
              console.log(`⚠️ ${endpointInfo.name} fetch failed for user ${integration.user_id}:`, endpointResult.error?.message);
              activities.push({
                user_id: integration.user_id,
                activity: 'endpoint_fetch_failed',
                endpoint: endpointInfo.name,
                error: endpointResult.error?.message,
                status: 'failed'
              });
            }
            
            // Small delay between API calls
            await new Promise(resolve => setTimeout(resolve, 500));
            
          } catch (error) {
            console.log(`❌ ${endpointInfo.name} fetch error for user ${integration.user_id}:`, error);
            activities.push({
              user_id: integration.user_id,
              activity: 'endpoint_fetch_error',
              endpoint: endpointInfo.name,
              error: error instanceof Error ? error.message : String(error),
              status: 'error'
            });
          }
        }
        
        // Activity 3: Fetch user profile information (more API activity)
        try {
          const profileResponse = await fetch(
            `${GRAPH_API_BASE}/me?fields=id,name,email&access_token=${accessToken}`
          );
          
          const profileResult = await profileResponse.json();
          
          if (profileResponse.ok) {
            console.log(`✅ Profile fetched for user ${integration.user_id}`);
            activities.push({
              user_id: integration.user_id,
              activity: 'profile_fetched',
              status: 'success'
            });
          } else {
            console.log(`⚠️ Profile fetch failed for user ${integration.user_id}:`, profileResult.error?.message);
            activities.push({
              user_id: integration.user_id,
              activity: 'profile_fetch_failed',
              error: profileResult.error?.message,
              status: 'failed'
            });
          }
        } catch (error) {
          console.log(`❌ Profile fetch error for user ${integration.user_id}:`, error);
          activities.push({
            user_id: integration.user_id,
            activity: 'profile_fetch_error',
            error: error instanceof Error ? error.message : String(error),
            status: 'error'
          });
        }
        
        // Activity 4: Fetch targeting search (more API activity)
        const searchTerms = ['automotive', 'cars', 'vehicles', 'dealership'];
        for (const term of searchTerms) {
          try {
            const searchResponse = await fetch(
              `${GRAPH_API_BASE}/act_${adAccountId}/targetingsearch?type=adinterest&q=${encodeURIComponent(term)}&limit=5&access_token=${accessToken}`
            );
            
            const searchResult = await searchResponse.json();
            
            if (searchResponse.ok) {
              console.log(`✅ Targeting search for "${term}" fetched for user ${integration.user_id}`);
              activities.push({
                user_id: integration.user_id,
                activity: 'targeting_search_fetched',
                term: term,
                results_count: searchResult.data?.length || 0,
                status: 'success'
              });
            } else {
              console.log(`⚠️ Targeting search for "${term}" failed for user ${integration.user_id}:`, searchResult.error?.message);
              activities.push({
                user_id: integration.user_id,
                activity: 'targeting_search_failed',
                term: term,
                error: searchResult.error?.message,
                status: 'failed'
              });
            }
            
            // Small delay between API calls
            await new Promise(resolve => setTimeout(resolve, 500));
            
          } catch (error) {
            console.log(`❌ Targeting search for "${term}" error for user ${integration.user_id}:`, error);
            activities.push({
              user_id: integration.user_id,
              activity: 'targeting_search_error',
              term: term,
              error: error instanceof Error ? error.message : String(error),
              status: 'error'
            });
          }
        }

        // Activity 5: pages_show_list - List user's pages
        try {
          const pagesResponse = await fetch(
            `${GRAPH_API_BASE}/me/accounts?fields=id,name,category,access_token&limit=25&access_token=${accessToken}`
          );
          
          const pagesResult = await pagesResponse.json();
          
          if (pagesResponse.ok) {
            console.log(`✅ Pages list fetched for user ${integration.user_id}`);
            activities.push({
              user_id: integration.user_id,
              activity: 'pages_list_fetched',
              permission: 'pages_show_list',
              pages_count: pagesResult.data?.length || 0,
              status: 'success'
            });

            // Activity 6: pages_read_engagement - Read page insights and posts
            if (pagesResult.data && pagesResult.data.length > 0) {
              const pageId = pagesResult.data[0].id;
              
              // Get page insights
              try {
                const pageInsightsResponse = await fetch(
                  `${GRAPH_API_BASE}/${pageId}/insights?metric=page_impressions,page_reach,page_engaged_users&period=day&since=${Math.floor(Date.now() / 1000) - 86400}&until=${Math.floor(Date.now() / 1000)}&access_token=${accessToken}`
                );
                
                const pageInsightsResult = await pageInsightsResponse.json();
                
                if (pageInsightsResponse.ok) {
                  console.log(`✅ Page insights fetched for user ${integration.user_id}`);
                  activities.push({
                    user_id: integration.user_id,
                    activity: 'page_insights_fetched',
                    permission: 'pages_read_engagement',
                    page_id: pageId,
                    data_points: pageInsightsResult.data?.length || 0,
                    status: 'success'
                  });
                } else {
                  console.log(`⚠️ Page insights fetch failed for user ${integration.user_id}:`, pageInsightsResult.error?.message);
                  activities.push({
                    user_id: integration.user_id,
                    activity: 'page_insights_failed',
                    permission: 'pages_read_engagement',
                    page_id: pageId,
                    error: pageInsightsResult.error?.message,
                    status: 'failed'
                  });
                }
              } catch (error) {
                console.log(`❌ Page insights error for user ${integration.user_id}:`, error);
                activities.push({
                  user_id: integration.user_id,
                  activity: 'page_insights_error',
                  permission: 'pages_read_engagement',
                  page_id: pageId,
                  error: error instanceof Error ? error.message : String(error),
                  status: 'error'
                });
              }

              // Get page posts
              try {
                const pagePostsResponse = await fetch(
                  `${GRAPH_API_BASE}/${pageId}/posts?fields=id,message,created_time,insights&limit=10&access_token=${accessToken}`
                );
                
                const pagePostsResult = await pagePostsResponse.json();
                
                if (pagePostsResponse.ok) {
                  console.log(`✅ Page posts fetched for user ${integration.user_id}`);
                  activities.push({
                    user_id: integration.user_id,
                    activity: 'page_posts_fetched',
                    permission: 'pages_read_engagement',
                    page_id: pageId,
                    posts_count: pagePostsResult.data?.length || 0,
                    status: 'success'
                  });
                } else {
                  console.log(`⚠️ Page posts fetch failed for user ${integration.user_id}:`, pagePostsResult.error?.message);
                  activities.push({
                    user_id: integration.user_id,
                    activity: 'page_posts_failed',
                    permission: 'pages_read_engagement',
                    page_id: pageId,
                    error: pagePostsResult.error?.message,
                    status: 'failed'
                  });
                }
              } catch (error) {
                console.log(`❌ Page posts error for user ${integration.user_id}:`, error);
                activities.push({
                  user_id: integration.user_id,
                  activity: 'page_posts_error',
                  permission: 'pages_read_engagement',
                  page_id: pageId,
                  error: error instanceof Error ? error.message : String(error),
                  status: 'error'
                });
              }
            }
          } else {
            console.log(`⚠️ Pages list fetch failed for user ${integration.user_id}:`, pagesResult.error?.message);
            activities.push({
              user_id: integration.user_id,
              activity: 'pages_list_failed',
              permission: 'pages_show_list',
              error: pagesResult.error?.message,
              status: 'failed'
            });
          }
        } catch (error) {
          console.log(`❌ Pages list error for user ${integration.user_id}:`, error);
          activities.push({
            user_id: integration.user_id,
            activity: 'pages_list_error',
            permission: 'pages_show_list',
            error: error instanceof Error ? error.message : String(error),
            status: 'error'
          });
        }

        // Activity 7: ads_management - Create test campaigns/ad sets (paused)
        try {
          const campaignData = {
            name: `API Test Campaign ${Date.now()}`,
            objective: 'OUTCOME_LEADS',
            status: 'PAUSED',
            special_ad_categories: []
          };

          const campaignResponse = await fetch(
            `${GRAPH_API_BASE}/act_${adAccountId}/campaigns`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(campaignData),
            }
          );

          const campaignResult = await campaignResponse.json();
          
          if (campaignResponse.ok) {
            console.log(`✅ Test campaign created for user ${integration.user_id}`);
            activities.push({
              user_id: integration.user_id,
              activity: 'campaign_created',
              permission: 'ads_management',
              campaign_id: campaignResult.id,
              status: 'success'
            });

            // Create test ad set
            const adSetData = {
              name: `API Test Ad Set ${Date.now()}`,
              campaign_id: campaignResult.id,
              optimization_goal: 'LEAD_GENERATION',
              billing_event: 'IMPRESSIONS',
              bid_amount: '1000',
              daily_budget: '1000',
              status: 'PAUSED',
              targeting: {
                geo_locations: { countries: ['US'] },
                age_min: 25,
                age_max: 65
              }
            };

            const adSetResponse = await fetch(
              `${GRAPH_API_BASE}/act_${adAccountId}/adsets`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(adSetData),
              }
            );

            const adSetResult = await adSetResponse.json();
            
            if (adSetResponse.ok) {
              console.log(`✅ Test ad set created for user ${integration.user_id}`);
              activities.push({
                user_id: integration.user_id,
                activity: 'adset_created',
                permission: 'ads_management',
                adset_id: adSetResult.id,
                campaign_id: campaignResult.id,
                status: 'success'
              });
            } else {
              console.log(`⚠️ Test ad set creation failed for user ${integration.user_id}:`, adSetResult.error?.message);
              activities.push({
                user_id: integration.user_id,
                activity: 'adset_creation_failed',
                permission: 'ads_management',
                campaign_id: campaignResult.id,
                error: adSetResult.error?.message,
                status: 'failed'
              });
            }
          } else {
            console.log(`⚠️ Test campaign creation failed for user ${integration.user_id}:`, campaignResult.error?.message);
            activities.push({
              user_id: integration.user_id,
              activity: 'campaign_creation_failed',
              permission: 'ads_management',
              error: campaignResult.error?.message,
              status: 'failed'
            });
          }
        } catch (error) {
          console.log(`❌ Campaign creation error for user ${integration.user_id}:`, error);
          activities.push({
            user_id: integration.user_id,
            activity: 'campaign_creation_error',
            permission: 'ads_management',
            error: error instanceof Error ? error.message : String(error),
            status: 'error'
          });
        }
        
        // Small delay between users to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`❌ Error processing user ${integration.user_id}:`, error);
        activities.push({
          user_id: integration.user_id,
          activity: 'user_processing_error',
          error: error instanceof Error ? error.message : String(error),
          status: 'error'
        });
      }
    }

    // Log the daily activity to database for tracking
    try {
      await executeQuery(
        'INSERT INTO facebook_daily_activity (date, activities, success_count, error_count) VALUES (?, ?, ?, ?)',
        [
          new Date().toISOString().split('T')[0], // YYYY-MM-DD
          JSON.stringify(activities),
          activities.filter(a => a.status === 'success').length,
          activities.filter(a => a.status === 'error' || a.status === 'failed').length
        ]
      );
    } catch (error) {
      console.log('⚠️ Could not log activity to database:', error);
    }

    console.log(`✅ Facebook Daily Activity completed. Processed ${integrations.length} users.`);
    
    // Count activities by permission
    const permissionCounts = {
      'pages_show_list': activities.filter(a => a.permission === 'pages_show_list').length,
      'pages_read_engagement': activities.filter(a => a.permission === 'pages_read_engagement').length,
      'ads_read': activities.filter(a => a.permission === 'ads_read' || !a.permission).length,
      'ads_management': activities.filter(a => a.permission === 'ads_management').length
    };
    
    return NextResponse.json({
      success: true,
      message: `Facebook Daily Activity completed for ${integrations.length} users`,
      date: new Date().toISOString(),
      activities,
      permissions_covered: ['pages_show_list', 'pages_read_engagement', 'ads_read', 'ads_management'],
      permission_counts: permissionCounts,
      summary: {
        total_users: integrations.length,
        total_api_calls: activities.length,
        successful_activities: activities.filter(a => a.status === 'success').length,
        failed_activities: activities.filter(a => a.status === 'failed').length,
        error_activities: activities.filter(a => a.status === 'error').length
      }
    });

  } catch (error) {
    console.error('❌ Facebook Daily Activity Cron Job failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Facebook Daily Activity failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}