typescript
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

    let activitiesAdded = 0;
    let creditsEarned = 0;

    // Sync based on provider
    if (provider === 'fitbit') {
      const result = await syncFitbitActivities(connection, supabaseClient);
      activitiesAdded = result.activitiesAdded;
      creditsEarned = result.creditsEarned;
    } else if (provider === 'google_fit') {
      const result = await syncGoogleFitActivities(connection, supabaseClient);
      activitiesAdded = result.activitiesAdded;
      creditsEarned = result.creditsEarned;
    } else {
      throw new Error('Unsupported provider');
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
        activitiesAdded,
        creditsEarned
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

async function syncFitbitActivities(connection: any, supabaseClient: any) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days
    
    const response = await fetch(
      `https://api.fitbit.com/1/user/-/activities/list.json?beforeDate=${new Date().toISOString().split('T')[0]}&sort=desc&offset=0&limit=20`,
      {
        headers: {
          'Authorization': `Bearer ${connection.access_token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Fitbit API error: ${response.status}`);
    }

    const data = await response.json();
    const activities = data.activities || [];
    
    let newCredits = 0;
    let newActivities = 0;

    for (const activity of activities) {
      // Check if activity already exists
      const { data: existing } = await supabaseClient
        .from('activities')
        .select('id')
        .eq('provider_activity_id', activity.logId?.toString())
        .single();

      if (existing) continue; // Skip duplicates

      const durationMinutes = Math.round(activity.duration / 60000);
      const credits = durationMinutes * 2; // 2 credits per minute

      const { error: insertError } = await supabaseClient
        .from('activities')
        .insert({
          user_id: connection.user_id,
          provider: 'fitbit',
          provider_activity_id: activity.logId?.toString(),
          activity_type: activity.activityName || 'Unknown',
          duration_minutes: durationMinutes,
          calories_burned: activity.calories || 0,
          distance_km: activity.distance ? parseFloat(activity.distance) : null,
          heart_rate_avg: activity.averageHeartRate || null,
          completed_at: new Date(activity.startTime).toISOString(),
          credits_earned: credits,
          trust_score: 1.0,
          metadata: activity
        });

      if (!insertError) {
        newCredits += credits;
        newActivities++;
      }
    }

    // Add credits to user balance
    if (newCredits > 0) {
      await supabaseClient.rpc('add_user_credits', {
        p_user_id: connection.user_id,
        p_amount: newCredits
      });
    }

    return { activitiesAdded: newActivities, creditsEarned: newCredits };

  } catch (error) {
    console.error('Fitbit sync error:', error);
    return { activitiesAdded: 0, creditsEarned: 0 };
  }
}

async function syncGoogleFitActivities(connection: any, supabaseClient: any) {
  try {
    const endTime = Date.now() * 1000000; // nanoseconds
    const startTime = (Date.now() - 7 * 24 * 60 * 60 * 1000) * 1000000; // 7 days ago
    
    const response = await fetch(
      `https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${startTime}&endTime=${endTime}`,
      {
        headers: {
          'Authorization': `Bearer ${connection.access_token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Google Fit API error: ${response.status}`);
    }

    const data = await response.json();
    const sessions = data.session || [];
    
    let newCredits = 0;
    let newActivities = 0;

    for (const session of sessions) {
      // Check if activity already exists
      const { data: existing } = await supabaseClient
        .from('activities')
        .select('id')
        .eq('provider_activity_id', session.id)
        .single();

      if (existing) continue; // Skip duplicates

      const durationMs = parseInt(session.endTimeMillis) - parseInt(session.startTimeMillis);
      const durationMinutes = Math.round(durationMs / 60000);
      const credits = durationMinutes * 2; // 2 credits per minute

      const { error: insertError } = await supabaseClient
        .from('activities')
        .insert({
          user_id: connection.user_id,
          provider: 'google_fit',
          provider_activity_id: session.id,
          activity_type: session.name || session.activityType || 'Unknown',
          duration_minutes: durationMinutes,
          calories_burned: 0,
          distance_km: null,
          heart_rate_avg: null,
          completed_at: new Date(parseInt(session.startTimeMillis)).toISOString(),
          credits_earned: credits,
          trust_score: 1.0,
          metadata: session
        });

      if (!insertError) {
        newCredits += credits;
        newActivities++;
      }
    }

    // Add credits to user balance
    if (newCredits > 0) {
      await supabaseClient.rpc('add_user_credits', {
        p_user_id: connection.user_id,
        p_amount: newCredits
      });
    }

    return { activitiesAdded: newActivities, creditsEarned: newCredits };

  } catch (error) {
    console.error('Google Fit sync error:', error);
    return { activitiesAdded: 0, creditsEarned: 0 };
  }
}
