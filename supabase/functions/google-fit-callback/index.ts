import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://id-preview--41e2b241-b160-4f6e-bb04-3c696c5f152a.lovable.app";

    if (error) {
      return Response.redirect(`${frontendUrl}/settings?error=google_denied`);
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

    const clientId = Deno.env.get("GOOGLE_FIT_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_FIT_CLIENT_SECRET");
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-fit-callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId!,
        client_secret: clientSecret!,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", await tokenResponse.text());
      return Response.redirect(`${frontendUrl}/settings?error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json();

    // Get user profile from Google
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    let providerUserId = null;
    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      providerUserId = profile.id;
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
        provider: "google_fit",
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

    return Response.redirect(`${frontendUrl}/settings?success=google_connected`);
  } catch (error) {
    console.error("Error in google-fit-callback:", error);
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://id-preview--41e2b241-b160-4f6e-bb04-3c696c5f152a.lovable.app";
    return Response.redirect(`${frontendUrl}/settings?error=internal_error`);
  }
});
