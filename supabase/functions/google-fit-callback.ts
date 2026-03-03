/ Supabase Edge Function: supabase/functions/google-fit-callback/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Handle user denial
    if (error) {
      return Response.redirect(https://fitloot.lovable.app/settings?error=google_denied);
    }

    if (!code || !state) {
      return Response.redirect(https://fitloot.lovable.app/settings?error=missing_params);
    }

    // Verify state parameter
    const { data: stateData, error: stateError } = await supabaseClient
      .from('oauth_states')
      .select('user_id, redirect_url')
      .eq('state', state)
      .eq('provider', 'google_fit')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (stateError || !stateData) {
      return Response.redirect(https://fitloot.lovable.app/settings?error=invalid_state);
    }

    const userId = stateData.user_id;

    // Exchange authorization code for access token
    const googleConfig = {
      clientId: '815879431098-tuano0duu5dqjt94eevbd3tourvi69oa.apps.googleusercontent.com',
      clientSecret: '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',
      redirectUri: 'https://fitloot.lovable.app/api/auth/google-fit/callback',
      tokenUrl: 'https://oauth2.googleapis.com/token'
    };

    const tokenParams = new URLSearchParams({
      client_id: googleConfig.clientId,
      client_secret: googleConfig.clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: googleConfig.redirectUri,
      code: code
    });

    const tokenResponse = await fetch(googleConfig.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: tokenParams.toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Google token exchange failed:', errorText);
      return Response.redirect(https://fitloot.lovable.app/settings?error=token_exchange_failed);
    }

    const tokenData = await tokenResponse.json();

    // Get user info to extract Google user ID
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': Bearer ${tokenData.access_token}
      }
    });

    let googleUserId = null;
    if (userInfoResponse.ok) {
      const userData = await userInfoResponse.json();
      googleUserId = userData.id || null;
    }

    // Calculate token expiry
    const expiresAt = tokenData.expires_in ? 
      new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString() : null;
    
    // Store or update connection in database
    const connectionData = {
      user_id: userId,
      provider: 'google_fit',
      provider_user_id: googleUserId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_expires_at: expiresAt,
      scopes: tokenData.scope ? tokenData.scope.split(' ') : null,
      is_active: true,
      updated_at: new Date().toISOString()
    };

    // Upsert connection (insert or update if exists)
    const { error: dbError } = await supabaseClient
      .from('wearable_connections')
      .upsert(connectionData, {
        onConflict: 'user_id,provider'
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return Response.redirect(https://fitloot.lovable.app/settings?error=database_error);
    }

    // Clean up OAuth state
    await supabaseClient
      .from('oauth_states')
      .delete()
      .eq('state', state);

    // Redirect back to app with success
    return Response.redirect(https://fitloot.lovable.app/settings?success=google_connected);

  } catch (error: any) {
    console.error('Google Fit callback error:', error);
    return Response.redirect(https://fitloot.lovable.app/settings?error=internal_error);
  }
});
