import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/** Calculate BMI effort multiplier matching the client-side logic */
function getEffortMultiplier(weightKg: number | null, heightCm: number | null): { multiplier: number; bmi: number | null } {
  if (!weightKg || !heightCm || heightCm <= 0 || weightKg <= 0) {
    return { multiplier: 1.0, bmi: null };
  }
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  if (bmi >= 35) return { multiplier: 2.0, bmi };
  if (bmi >= 30) return { multiplier: 1.5, bmi };
  if (bmi >= 25) return { multiplier: 1.25, bmi };
  return { multiplier: 1.0, bmi };
}

/** Wearable activities get a trust score of 100 (verified source) */
const WEARABLE_TRUST_SCORE = 100;
const CREDITS_PER_MINUTE = 2;

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

    // Fetch user profile for BMI-based effort multiplier
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('weight_kg, height_cm')
      .eq('user_id', userId)
      .single();

    const { multiplier: effortMultiplier, bmi } = getEffortMultiplier(
      profile?.weight_kg ?? null,
      profile?.height_cm ?? null
    );

    console.log(`User ${userId}: BMI=${bmi?.toFixed(1) ?? 'N/A'}, effortMultiplier=${effortMultiplier}`);

    let activitiesAdded = 0;
    let creditsEarned = 0;

    if (provider === 'fitbit') {
      const result = await syncFitbitActivities(connection, supabaseClient, effortMultiplier);
      activitiesAdded = result.activitiesAdded;
      creditsEarned = result.creditsEarned;
    } else if (provider === 'google_fit') {
      const result = await syncGoogleFitActivities(connection, supabaseClient, effortMultiplier);
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

    // Send notification if new activities were synced
    if (activitiesAdded > 0) {
      const providerName = provider === 'google_fit' ? 'Google Fit' : 'Fitbit';
      const bonusNote = effortMultiplier > 1 ? ` (x${effortMultiplier} esfuerzo)` : '';
      await supabaseClient.from('notifications').insert({
        user_id: userId,
        type: 'sync',
        title: `🔄 Sincronización ${providerName}`,
        message: `Se sincronizaron ${activitiesAdded} actividad${activitiesAdded > 1 ? 'es' : ''} nuevas. ¡Ganaste ${creditsEarned} créditos${bonusNote}!`,
        icon: 'activity',
        metadata: { provider, activitiesAdded, creditsEarned, effortMultiplier },
      });
    }

    return new Response(
      JSON.stringify({ success: true, activitiesAdded, creditsEarned, effortMultiplier }),
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

/** Calculate credits with effort multiplier applied */
function calculateCredits(durationMinutes: number, effortMultiplier: number): number {
  const base = durationMinutes * CREDITS_PER_MINUTE;
  return Math.round(base * effortMultiplier);
}

async function syncFitbitActivities(connection: any, supabaseClient: any, effortMultiplier: number) {
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

      const { data: existing } = await supabaseClient
        .from('activities')
        .select('id')
        .eq('external_id', externalId)
        .eq('provider', 'fitbit')
        .maybeSingle();

      if (existing) continue;

      const durationMinutes = Math.round((activity.duration || 0) / 60000);
      const credits = calculateCredits(durationMinutes, effortMultiplier);
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
          trust_score: WEARABLE_TRUST_SCORE,
          source: 'fitbit',
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
    console.error('Fitbit sync error:', error);
    return { activitiesAdded: 0, creditsEarned: 0 };
  }
}

async function syncGoogleFitActivities(connection: any, supabaseClient: any, effortMultiplier: number) {
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
      const credits = calculateCredits(durationMinutes, effortMultiplier);

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
          trust_score: WEARABLE_TRUST_SCORE,
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
