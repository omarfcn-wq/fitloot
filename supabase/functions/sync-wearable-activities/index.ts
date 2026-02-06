import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CREDITS_PER_MINUTE = 2;

async function refreshFitbitToken(connection: any, supabase: any) {
  const response = await fetch("https://api.fitbit.com/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${Deno.env.get("FITBIT_CLIENT_ID")}:${Deno.env.get("FITBIT_CLIENT_SECRET")}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: connection.refresh_token,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Fitbit token");
  }

  const tokens = await response.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await supabase.from("wearable_connections").update({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || connection.refresh_token,
    token_expires_at: expiresAt,
  }).eq("id", connection.id);

  return tokens.access_token;
}

async function refreshGoogleToken(connection: any, supabase: any) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: connection.refresh_token,
      client_id: Deno.env.get("GOOGLE_FIT_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_FIT_CLIENT_SECRET")!,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Google token");
  }

  const tokens = await response.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await supabase.from("wearable_connections").update({
    access_token: tokens.access_token,
    token_expires_at: expiresAt,
  }).eq("id", connection.id);

  return tokens.access_token;
}

async function syncFitbitActivities(connection: any, supabase: any) {
  let accessToken = connection.access_token;
  
  // Check if token needs refresh
  if (new Date(connection.token_expires_at) < new Date()) {
    accessToken = await refreshFitbitToken(connection, supabase);
  }

  // Get activities from last 7 days
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dateStr = today.toISOString().split("T")[0];
  const weekAgoStr = weekAgo.toISOString().split("T")[0];

  const response = await fetch(
    `https://api.fitbit.com/1/user/-/activities/list.json?afterDate=${weekAgoStr}&sort=asc&limit=100&offset=0`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    throw new Error(`Fitbit API error: ${response.status}`);
  }

  const data = await response.json();
  const activities = data.activities || [];
  let newCredits = 0;

  for (const activity of activities) {
    const externalId = `fitbit_${activity.logId}`;
    
    // Check if already synced
    const { data: existing } = await supabase
      .from("activities")
      .select("id")
      .eq("external_id", externalId)
      .single();

    if (existing) continue;

    const durationMinutes = Math.round(activity.duration / 60000);
    const creditsEarned = durationMinutes * CREDITS_PER_MINUTE;

    const { error: insertError } = await supabase.from("activities").insert({
      user_id: connection.user_id,
      activity_type: activity.activityName || activity.activityParentName || "exercise",
      duration_minutes: durationMinutes,
      credits_earned: creditsEarned,
      source: "fitbit",
      provider: "fitbit",
      external_id: externalId,
      completed_at: activity.startTime,
    });

    if (!insertError) {
      newCredits += creditsEarned;
    }
  }

  // Update user credits
  if (newCredits > 0) {
    const { data: currentCredits } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", connection.user_id)
      .single();

    await supabase.from("user_credits").update({
      balance: (currentCredits?.balance || 0) + newCredits,
    }).eq("user_id", connection.user_id);
  }

  // Update last sync time
  await supabase.from("wearable_connections").update({
    last_sync_at: new Date().toISOString(),
  }).eq("id", connection.id);

  return { activitiesSynced: activities.length, creditsEarned: newCredits };
}

async function syncGoogleFitActivities(connection: any, supabase: any) {
  let accessToken = connection.access_token;
  
  // Check if token needs refresh
  if (new Date(connection.token_expires_at) < new Date()) {
    accessToken = await refreshGoogleToken(connection, supabase);
  }

  // Get activities from last 7 days
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const response = await fetch(
    `https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${new Date(weekAgo).toISOString()}&endTime=${new Date(now).toISOString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    throw new Error(`Google Fit API error: ${response.status}`);
  }

  const data = await response.json();
  const sessions = data.session || [];
  let newCredits = 0;

  for (const session of sessions) {
    const externalId = `googlefit_${session.id}`;
    
    // Check if already synced
    const { data: existing } = await supabase
      .from("activities")
      .select("id")
      .eq("external_id", externalId)
      .single();

    if (existing) continue;

    const startTimeMs = parseInt(session.startTimeMillis);
    const endTimeMs = parseInt(session.endTimeMillis);
    const durationMinutes = Math.round((endTimeMs - startTimeMs) / 60000);
    const creditsEarned = durationMinutes * CREDITS_PER_MINUTE;

    const { error: insertError } = await supabase.from("activities").insert({
      user_id: connection.user_id,
      activity_type: session.name || session.activityType?.toString() || "exercise",
      duration_minutes: durationMinutes,
      credits_earned: creditsEarned,
      source: "google_fit",
      provider: "google_fit",
      external_id: externalId,
      completed_at: new Date(startTimeMs).toISOString(),
    });

    if (!insertError) {
      newCredits += creditsEarned;
    }
  }

  // Update user credits
  if (newCredits > 0) {
    const { data: currentCredits } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", connection.user_id)
      .single();

    await supabase.from("user_credits").update({
      balance: (currentCredits?.balance || 0) + newCredits,
    }).eq("user_id", connection.user_id);
  }

  // Update last sync time
  await supabase.from("wearable_connections").update({
    last_sync_at: new Date().toISOString(),
  }).eq("id", connection.id);

  return { activitiesSynced: sessions.length, creditsEarned: newCredits };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role for database operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Parse body
    let provider: string | null = null;
    let syncAll = false;
    try {
      const body = await req.json();
      provider = body.provider;
      syncAll = body.syncAll === true;
    } catch {
      // No body
    }

    // If syncAll is true (cron job), sync all active connections for all users
    if (syncAll) {
      console.log("Running scheduled sync for all users...");
      
      const { data: connections, error: connError } = await supabase
        .from("wearable_connections")
        .select("*")
        .eq("is_active", true);

      if (connError) {
        throw connError;
      }

      const results: any = { usersProcessed: 0, totalCredits: 0, errors: [] };

      for (const connection of connections || []) {
        try {
          if (connection.provider === "fitbit") {
            const result = await syncFitbitActivities(connection, supabase);
            results.totalCredits += result.creditsEarned;
          } else if (connection.provider === "google_fit") {
            const result = await syncGoogleFitActivities(connection, supabase);
            results.totalCredits += result.creditsEarned;
          }
          results.usersProcessed++;
        } catch (error) {
          console.error(`Error syncing ${connection.provider} for user ${connection.user_id}:`, error);
          results.errors.push({ userId: connection.user_id, provider: connection.provider, error: error.message });
        }
      }

      console.log(`Sync complete: ${results.usersProcessed} connections processed, ${results.totalCredits} credits earned`);

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Individual user sync - requires authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Get active connections for this user
    const { data: connections, error: connError } = await supabase
      .from("wearable_connections")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (connError) {
      throw connError;
    }

    const results: any = {};

    for (const connection of connections || []) {
      if (provider && connection.provider !== provider) continue;

      try {
        if (connection.provider === "fitbit") {
          results.fitbit = await syncFitbitActivities(connection, supabase);
        } else if (connection.provider === "google_fit") {
          results.google_fit = await syncGoogleFitActivities(connection, supabase);
        }
      } catch (error) {
        console.error(`Error syncing ${connection.provider}:`, error);
        results[connection.provider] = { error: error.message };
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in sync-wearable-activities:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
