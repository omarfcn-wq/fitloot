// Supabase Edge Function: supabase/functions/sync-wearable-activities/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { provider, userId } = await req.json();

    if (!provider || !userId) {
      throw new Error('Provider and userId are required');
    }

    // Get active connection for the provider
    const { data: connection, error: connectionError } = await supabaseClient
      .from('wearable_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .single();

    if (connectionError || !connection) {
      throw new Error('No active connection found for provider');
    }

    let activities = [];
    let creditsEarned = 0;

    // Sync based on provider
    if (provider === 'fitbit') {
      activities = await syncFitbitActivities(connection);
    } else if (provider === 'google_fit') {
      activities = await syncGoogleFitActivities(connection);
    } else {
      throw new Error('Unsupported provider');
    }

    // Process and store activities
    for (const activity of activities) {
      const processedActivity = await processActivity(activity, userId, provider, supabaseClient);
      if (processedActivity) {
        creditsEarned += processedActivity.credits_earned;
      }
    }

    // Update connection sync timestamp
    await supabaseClient
      .from('wearable_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', connection.id);

    return new Response(
      JSON.stringify({
        success: true,
        activitiesAdded: activities.length,
        creditsEarned: creditsEarned
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error: any) {
    console.error('Sync error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        activitiesAdded: 0,
        creditsEarned: 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});

async function syncFitbitActivities(connection: any) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days
    
    const response = await fetch(
      https://api.fitbit.com/1/user/-/activities/list.json?beforeDate=${new Date().toISOString().split('T')[0]}&sort=desc&offset=0&limit=20,
      {
        headers: {
          'Authorization': Bearer ${connection.access_token}
        }
      }
    );

    if (!response.ok) {
      throw new Error(Fitbit API error: ${response.status});
    }

    const data = await response.json();
    return data.activities || [];
  } catch (error) {
    console.error('Fitbit sync error:', error);
    return [];
  }
}

async function syncGoogleFitActivities(connection: any) {
  try {
    const endTime = Date.now() * 1000000; // nanoseconds
    const startTime = (Date.now() - 7 * 24 * 60 * 60 * 1000) * 1000000; // 7 days ago in nanosecondsconst response = await fetch(
      https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${startTime}&endTime=${endTime},
      {
        headers: {
          'Authorization': Bearer ${connection.access_token}
        }
      }
    );

    if (!response.ok) {
      throw new Error(Google Fit API error: ${response.status});
    }

    const data = await response.json();
    return data.session || [];
  } catch (error) {
    console.error('Google Fit sync error:', error);
    return [];
  }
}

async function processActivity(activity: any, userId: string, provider: string, supabaseClient: any) {
  try {
    let processedActivity;

    if (provider === 'fitbit') {
      processedActivity = {
        user_id: userId,
        provider: provider,
        provider_activity_id: activity.logId?.toString(),
        activity_type: activity.activityName || 'Unknown',
        duration_minutes: Math.round(activity.duration / 60000), // Convert ms to minutes
        calories_burned: activity.calories || 0,
        distance_km: activity.distance ? parseFloat(activity.distance) : null,
        heart_rate_avg: activity.averageHeartRate || null,
        completed_at: new Date(activity.startTime).toISOString(),
        metadata: activity
      };
    } else if (provider === 'google_fit') {
      const durationMs = parseInt(activity.endTimeMillis) - parseInt(activity.startTimeMillis);
      processedActivity = {
        user_id: userId,
        provider: provider,
        provider_activity_id: activity.id,
        activity_type: activity.name || activity.activityType || 'Unknown',
        duration_minutes: Math.round(durationMs / 60000),
        calories_burned: 0, // Google Fit doesn't provide calories in sessions
        distance_km: null,
        heart_rate_avg: null,
        completed_at: new Date(parseInt(activity.startTimeMillis)).toISOString(),
        metadata: activity
      };
    }

    // Calculate trust score (anti-cheat)
    const trustScore = calculateTrustScore(processedActivity);
    processedActivity.trust_score = trustScore;

    // Calculate credits using database function
    const { data: creditsResult } = await supabaseClient.rpc('calculate_effort_credits', {
      p_user_id: userId,
      p_duration_minutes: processedActivity.duration_minutes,
      p_heart_rate_avg: processedActivity.heart_rate_avg,
      p_activity_type: processedActivity.activity_type.toLowerCase()
    });

    const baseCredits = creditsResult || (processedActivity.duration_minutes * 2);
    
    // Apply trust score penalty
    const finalCredits = Math.round(baseCredits * Math.min(trustScore, 1.0));
    processedActivity.credits_earned = finalCredits;

    // Insert activity (ignore duplicates)
    const { data: insertedActivity, error: insertError } = await supabaseClient
      .from('activities')
      .insert(processedActivity)
      .select()
      .single();

    if (insertError) {
      // Likely a duplicate, skip
      console.log('Activity already exists, skipping');
      return null;
    }

    // Add credits to user balance
    if (finalCredits > 0) {
      await supabaseClient.rpc('add_user_credits', {
        p_user_id: userId,
        p_amount: finalCredits
      });
    }

    return insertedActivity;

  } catch (error) {
    console.error('Error processing activity:', error);
    return null;
  }
}

function calculateTrustScore(activity: any): number {
  let score = 1.0;
  const flags = [];

  // Check for unrealistic calorie burn
  if (activity.calories_burned > activity.duration_minutes * 20) {
    score *= 0.7;
    flags.push('high_calories');
  }

  // Check for missing heart rate data in cardio activities
  const cardioActivities = ['running', 'cycling', 'swimming', 'aerobics'];
  if (cardioActivities.includes(activity.activity_type.toLowerCase()) && !activity.heart_rate_avg) {
    score *= 0.8;
    flags.push('no_heart_rate');
  }

  // Check for very long durationif (activity.duration_minutes > 300) { // 5+ hours
    score *= 0.6;
    flags.push('very_long_duration');
  }

  activity.trust_flags = flags;
  return Math.max(0.3, score); // Minimum 30% of credits
}
