import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CREDITS_PER_MINUTE = 2;

// ============= TRUST SCORE ALGORITHM =============

interface ActivityData {
  activityType: string;
  durationMinutes: number;
  source: "manual" | "fitbit" | "google_fit" | "apple_health";
  heartRateAvg?: number;
  heartRateMax?: number;
  caloriesBurned?: number;
  distanceMeters?: number;
}

interface ValidationRule {
  activity_type: string;
  min_duration_minutes: number;
  max_duration_minutes: number;
  expected_hr_min: number;
  expected_hr_max: number;
  min_calories_per_minute: number;
  max_calories_per_minute: number;
}

interface TrustScoreResult {
  score: number;
  flags: string[];
}

const DEFAULT_RULES: Record<string, Omit<ValidationRule, "activity_type">> = {
  running: { min_duration_minutes: 5, max_duration_minutes: 180, expected_hr_min: 120, expected_hr_max: 190, min_calories_per_minute: 8, max_calories_per_minute: 18 },
  cycling: { min_duration_minutes: 10, max_duration_minutes: 300, expected_hr_min: 100, expected_hr_max: 175, min_calories_per_minute: 5, max_calories_per_minute: 15 },
  gym: { min_duration_minutes: 15, max_duration_minutes: 180, expected_hr_min: 90, expected_hr_max: 170, min_calories_per_minute: 4, max_calories_per_minute: 12 },
  swimming: { min_duration_minutes: 10, max_duration_minutes: 120, expected_hr_min: 110, expected_hr_max: 180, min_calories_per_minute: 7, max_calories_per_minute: 14 },
  hiking: { min_duration_minutes: 20, max_duration_minutes: 480, expected_hr_min: 90, expected_hr_max: 160, min_calories_per_minute: 4, max_calories_per_minute: 10 },
  walking: { min_duration_minutes: 10, max_duration_minutes: 180, expected_hr_min: 70, expected_hr_max: 130, min_calories_per_minute: 2, max_calories_per_minute: 6 },
  yoga: { min_duration_minutes: 15, max_duration_minutes: 120, expected_hr_min: 60, expected_hr_max: 120, min_calories_per_minute: 1, max_calories_per_minute: 4 },
  exercise: { min_duration_minutes: 5, max_duration_minutes: 240, expected_hr_min: 80, expected_hr_max: 175, min_calories_per_minute: 3, max_calories_per_minute: 15 },
};

function getRule(activityType: string, customRules?: ValidationRule[]): Omit<ValidationRule, "activity_type"> {
  if (customRules) {
    const customRule = customRules.find(r => r.activity_type.toLowerCase() === activityType.toLowerCase());
    if (customRule) return customRule;
  }
  const normalizedType = activityType.toLowerCase();
  return DEFAULT_RULES[normalizedType] ?? DEFAULT_RULES.exercise;
}

function calculateTrustScore(activity: ActivityData, customRules?: ValidationRule[]): TrustScoreResult {
  let score = 100;
  const flags: string[] = [];
  const rule = getRule(activity.activityType, customRules);

  // 1. Source Validation (+10 for wearable)
  if (activity.source === "manual") {
    if (!activity.heartRateAvg) {
      score -= 20;
      flags.push("manual_no_biometrics");
    } else {
      score -= 10;
      flags.push("manual_with_biometrics");
    }
  } else {
    score += 10; // Wearable bonus
  }

  // 2. Duration Validation
  if (activity.durationMinutes < rule.min_duration_minutes) {
    score -= 15;
    flags.push("duration_too_short");
  } else if (activity.durationMinutes > rule.max_duration_minutes) {
    score -= 25;
    flags.push("duration_exceeds_limit");
  } else if (activity.durationMinutes > rule.max_duration_minutes * 0.8) {
    score -= 5;
    flags.push("duration_near_limit");
  }

  // 3. Heart Rate Correlation
  if (activity.heartRateAvg !== undefined && activity.heartRateAvg > 0) {
    if (activity.heartRateAvg < rule.expected_hr_min * 0.7) {
      score -= 35;
      flags.push("hr_too_low_for_activity");
    } else if (activity.heartRateAvg < rule.expected_hr_min) {
      score -= 15;
      flags.push("hr_below_expected");
    }
    
    if (activity.heartRateAvg > rule.expected_hr_max * 1.2) {
      score -= 20;
      flags.push("hr_abnormally_high");
    }
    
    if (activity.heartRateMax !== undefined && activity.heartRateMax === activity.heartRateAvg) {
      score -= 30;
      flags.push("hr_no_variance_suspicious");
    }
    
    if (activity.heartRateMax !== undefined && activity.heartRateAvg > 0) {
      const hrVariance = (activity.heartRateMax - activity.heartRateAvg) / activity.heartRateAvg;
      if (hrVariance < 0.05 && activity.durationMinutes > 10) {
        score -= 20;
        flags.push("hr_variance_too_low");
      }
    }
  } else if (activity.source !== "manual") {
    score -= 15;
    flags.push("wearable_missing_hr");
  }

  // 4. Calorie Correlation
  if (activity.caloriesBurned !== undefined && activity.caloriesBurned > 0) {
    const caloriesPerMinute = activity.caloriesBurned / activity.durationMinutes;
    
    if (caloriesPerMinute < rule.min_calories_per_minute * 0.5) {
      score -= 20;
      flags.push("calories_too_low");
    } else if (caloriesPerMinute > rule.max_calories_per_minute * 1.5) {
      score -= 25;
      flags.push("calories_unrealistic");
    }
  }

  // 5. Consistency Check
  if (activity.heartRateAvg && activity.caloriesBurned && activity.durationMinutes > 0) {
    const expectedCalories = ((activity.heartRateAvg - 60) * 0.1) * activity.durationMinutes;
    const deviation = Math.abs(activity.caloriesBurned - expectedCalories) / expectedCalories;
    
    if (deviation > 0.5) {
      score -= 15;
      flags.push("hr_calorie_mismatch");
    }
  }

  score = Math.max(0, Math.min(100, score));

  return { score, flags };
}

// ============= TOKEN REFRESH =============

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

// ============= SYNC FUNCTIONS =============

async function syncFitbitActivities(connection: any, supabase: any, validationRules?: ValidationRule[]) {
  let accessToken = connection.access_token;
  
  if (new Date(connection.token_expires_at) < new Date()) {
    accessToken = await refreshFitbitToken(connection, supabase);
  }

  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
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
    
    const { data: existing } = await supabase
      .from("activities")
      .select("id")
      .eq("external_id", externalId)
      .single();

    if (existing) continue;

    const durationMinutes = Math.round(activity.duration / 60000);
    const activityType = activity.activityName || activity.activityParentName || "exercise";
    
    // Extract biometric data from Fitbit
    const heartRateAvg = activity.averageHeartRate || null;
    const heartRateMax = activity.heartRateZones?.reduce((max: number, zone: any) => 
      Math.max(max, zone.max || 0), 0) || null;
    const caloriesBurned = activity.calories || null;
    const distanceMeters = activity.distance ? Math.round(activity.distance * 1000) : null;
    
    // Calculate trust score
    const trustResult = calculateTrustScore({
      activityType,
      durationMinutes,
      source: "fitbit",
      heartRateAvg,
      heartRateMax,
      caloriesBurned,
      distanceMeters,
    }, validationRules);

    const creditsEarned = durationMinutes * CREDITS_PER_MINUTE;

    const { error: insertError } = await supabase.from("activities").insert({
      user_id: connection.user_id,
      activity_type: activityType,
      duration_minutes: durationMinutes,
      credits_earned: creditsEarned,
      source: "fitbit",
      provider: "fitbit",
      external_id: externalId,
      completed_at: activity.startTime,
      trust_score: trustResult.score,
      trust_flags: trustResult.flags,
      heart_rate_avg: heartRateAvg,
      heart_rate_max: heartRateMax,
      calories_burned: caloriesBurned,
      distance_meters: distanceMeters,
    });

    if (!insertError) {
      newCredits += creditsEarned;
    }
  }

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

  await supabase.from("wearable_connections").update({
    last_sync_at: new Date().toISOString(),
  }).eq("id", connection.id);

  return { activitiesSynced: activities.length, creditsEarned: newCredits };
}

async function syncGoogleFitActivities(connection: any, supabase: any, validationRules?: ValidationRule[]) {
  let accessToken = connection.access_token;
  
  if (new Date(connection.token_expires_at) < new Date()) {
    accessToken = await refreshGoogleToken(connection, supabase);
  }

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
    
    const { data: existing } = await supabase
      .from("activities")
      .select("id")
      .eq("external_id", externalId)
      .single();

    if (existing) continue;

    const startTimeMs = parseInt(session.startTimeMillis);
    const endTimeMs = parseInt(session.endTimeMillis);
    const durationMinutes = Math.round((endTimeMs - startTimeMs) / 60000);
    const activityType = session.name || session.activityType?.toString() || "exercise";
    
    // Google Fit doesn't always include HR in session data
    // In a production app, you'd make additional API calls to get heart rate data
    const heartRateAvg = null;
    const heartRateMax = null;
    const caloriesBurned = null;
    const distanceMeters = null;
    
    // Calculate trust score
    const trustResult = calculateTrustScore({
      activityType,
      durationMinutes,
      source: "google_fit",
      heartRateAvg: heartRateAvg ?? undefined,
      heartRateMax: heartRateMax ?? undefined,
      caloriesBurned: caloriesBurned ?? undefined,
      distanceMeters: distanceMeters ?? undefined,
    }, validationRules);

    const creditsEarned = durationMinutes * CREDITS_PER_MINUTE;

    const { error: insertError } = await supabase.from("activities").insert({
      user_id: connection.user_id,
      activity_type: activityType,
      duration_minutes: durationMinutes,
      credits_earned: creditsEarned,
      source: "google_fit",
      provider: "google_fit",
      external_id: externalId,
      completed_at: new Date(startTimeMs).toISOString(),
      trust_score: trustResult.score,
      trust_flags: trustResult.flags,
      heart_rate_avg: heartRateAvg,
      heart_rate_max: heartRateMax,
      calories_burned: caloriesBurned,
      distance_meters: distanceMeters,
    });

    if (!insertError) {
      newCredits += creditsEarned;
    }
  }

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

  await supabase.from("wearable_connections").update({
    last_sync_at: new Date().toISOString(),
  }).eq("id", connection.id);

  return { activitiesSynced: sessions.length, creditsEarned: newCredits };
}

// ============= MAIN HANDLER =============

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch validation rules
    const { data: validationRules } = await supabase
      .from("activity_validation_rules")
      .select("*");

    let provider: string | null = null;
    let syncAll = false;
    try {
      const body = await req.json();
      provider = body.provider;
      syncAll = body.syncAll === true;
    } catch {
      // No body
    }

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
            const result = await syncFitbitActivities(connection, supabase, validationRules || undefined);
            results.totalCredits += result.creditsEarned;
          } else if (connection.provider === "google_fit") {
            const result = await syncGoogleFitActivities(connection, supabase, validationRules || undefined);
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

    // Individual user sync
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
          results.fitbit = await syncFitbitActivities(connection, supabase, validationRules || undefined);
        } else if (connection.provider === "google_fit") {
          results.google_fit = await syncGoogleFitActivities(connection, supabase, validationRules || undefined);
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
