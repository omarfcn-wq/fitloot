import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // Get the frontend URL from environment or use default
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://id-preview--41e2b241-b160-4f6e-bb04-3c696c5f152a.lovable.app";

    if (error) {
      return Response.redirect(`${frontendUrl}/settings?error=fitbit_denied`);
    }

    if (!code || !state) {
      return Response.redirect(`${frontendUrl}/settings?error=missing_params`);
    }

    let userId: string;
    try {
      const decoded = JSON.parse(atob(state));
      userId = decoded.userId;
    } catch {
      return Response.redirect(`${frontendUrl}/settings?error=invalid_state`);
    }

    const clientId = Deno.env.get("FITBIT_CLIENT_ID");
    const clientSecret = Deno.env.get("FITBIT_CLIENT_SECRET");
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/fitbit-callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch("https://api.fitbit.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", await tokenResponse.text());
      return Response.redirect(`${frontendUrl}/settings?error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json();

    // Get user profile from Fitbit
    const profileResponse = await fetch("https://api.fitbit.com/1/user/-/profile.json", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    let providerUserId = null;
    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      providerUserId = profile.user?.encodedId;
    }

    // Store connection in database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error: upsertError } = await supabase.from("wearable_connections").upsert(
      {
        user_id: userId,
        provider: "fitbit",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        provider_user_id: providerUserId,
        scopes: tokens.scope?.split(" ") || [],
        is_active: true,
      },
      { onConflict: "user_id,provider" }
    );

    if (upsertError) {
      console.error("Database error:", upsertError);
      return Response.redirect(`${frontendUrl}/settings?error=database_error`);
    }

    return Response.redirect(`${frontendUrl}/settings?success=fitbit_connected`);
  } catch (error) {
    console.error("Error in fitbit-callback:", error);
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://id-preview--41e2b241-b160-4f6e-bb04-3c696c5f152a.lovable.app";
    return Response.redirect(`${frontendUrl}/settings?error=internal_error`);
  }
});
