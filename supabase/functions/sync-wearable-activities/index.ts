import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
      JSON.stringify({ success: true, activitiesAdded, creditsEarned }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );

  } catch (error: any) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message, activitiesAdded: 0, creditsEarned: 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    );
  }
});

async function syncFitbitActivities(connection: any, supabaseClient: any) {
  try {
    const response = await fetch(
      `https://api.fitbit.com/1/user/-/activities/list.json?beforeDate=${new Date().toISOString().split('T')[0]}&sort=desc&offset=0&limit=20`,
      { headers: { 'Authorization': `Bearer ${connection.access_token}` } }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Fitbit API error: ${response.status} - ${body}`);
    }

    const data = await response.json();
    const activities = data.activities || [];
    let newCredits = 0;
    let newActivities = 0;

    for (const activity of activities) {
      const externalId = activity.logId?.toString();
      if (!externalId) continue;

      // Check duplicate
      const { data: existing } = await supabaseClient
        .from('activities')
        .select('id')
        .eq('external_id', externalId)
        .eq('provider', 'fitbit')
        .maybeSingle();

      if (existing) continue;

      const durationMinutes = Math.round((activity.duration || 0) / 60000);
      const credits = durationMinutes * 2;
      const distanceMeters = activity.distance ? Math.round(parseFloat(activity.distance) * 1000) : null;

      const { error: insertError } = await supabaseClient
        .from('activities')
        .insert({
          user_id: connection.user_id,
          provider: 'fitbit',
          external_id: externalId,
          activity_type: activity.activityName || 'Unknown',
          duration_minutes: durationMinutes,
          calories_burned: activity.calories || null,
          distance_meters: distanceMeters,
          heart_rate_avg: activity.averageHeartRate || null,
          completed_at: new Date(activity.startTime).toISOString(),
          credits_earned: credits,
          trust_score: 100,
          source: 'fitbit',
        });

      if (!insertError) {
        newCredits += credits;
        newActivities++;
      }
    }

    // Update user credits
    if (newCredits > 0) {
      const { data: currentCredits } = await supabaseClient
        .from('user_credits')
        .select('balance')
        .eq('user_id', connection.user_id)
        .single();

      if (currentCredits) {
        await supabaseClient
          .from('user_credits')
          .update({ balance: currentCredits.balance + newCredits })
          .eq('user_id', connection.user_id);
      }
    }

    return { activitiesAdded: newActivities, creditsEarned: newCredits };
  } catch (error) {
    console.error('Fitbit sync error:', error);
    return { activitiesAdded: 0, creditsEarned: 0 };
  }
}

async function syncGoogleFitActivities(connection: any, supabaseClient: any) {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const response = await fetch(
      `https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${weekAgo.toISOString()}&endTime=${now.toISOString()}`,
      { headers: { 'Authorization': `Bearer ${connection.access_token}` } }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Google Fit API error: ${response.status} - ${body}`);
    }

    const data = await response.json();
    const sessions = data.session || [];
    let newCredits = 0;
    let newActivities = 0;

    for (const session of sessions) {
      const externalId = session.id;
      if (!externalId) continue;

      const { data: existing } = await supabaseClient
        .from('activities')
        .select('id')
        .eq('external_id', externalId)
        .eq('provider', 'google_fit')
        .maybeSingle();

      if (existing) continue;

      const durationMs = parseInt(session.endTimeMillis) - parseInt(session.startTimeMillis);
      const durationMinutes = Math.round(durationMs / 60000);
      const credits = durationMinutes * 2;

      const { error: insertError } = await supabaseClient
        .from('activities')
        .insert({
          user_id: connection.user_id,
          provider: 'google_fit',
          external_id: externalId,
          activity_type: session.name || session.activityType?.toString() || 'Unknown',
          duration_minutes: durationMinutes,
          completed_at: new Date(parseInt(session.startTimeMillis)).toISOString(),
          credits_earned: credits,
          trust_score: 100,
          source: 'google_fit',
        });

      if (!insertError) {
        newCredits += credits;
        newActivities++;
      }
    }

    if (newCredits > 0) {
      const { data: currentCredits } = await supabaseClient
        .from('user_credits')
        .select('balance')
        .eq('user_id', connection.user_id)
        .single();

      if (currentCredits) {
        await supabaseClient
          .from('user_credits')
          .update({ balance: currentCredits.balance + newCredits })
          .eq('user_id', connection.user_id);
      }
    }

    return { activitiesAdded: newActivities, creditsEarned: newCredits };
  } catch (error) {
    console.error('Google Fit sync error:', error);
    return { activitiesAdded: 0, creditsEarned: 0 };
  }
}
