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

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';

  try {
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      return Response.redirect('https://fitloot.lovable.app/settings?error=fitbit_denied');
    }

    if (!code || !state) {
      return Response.redirect('https://fitloot.lovable.app/settings?error=missing_params');
    }

    // Verify state parameter
    const { data: stateData, error: stateError } = await supabaseClient
      .from('oauth_states')
      .select('user_id, redirect_url')
      .eq('state', state)
      .eq('provider', 'fitbit')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (stateError || !stateData) {
      return Response.redirect('https://fitloot.lovable.app/settings?error=invalid_state');
    }

    const userId = stateData.user_id;

    // Use environment variables for credentials
    const clientId = Deno.env.get('FITBIT_CLIENT_ID') ?? '';
    const clientSecret = Deno.env.get('FITBIT_CLIENT_SECRET') ?? '';
    const redirectUri = `${supabaseUrl}/functions/v1/fitbit-callback`;

    // Exchange authorization code for access token
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code: code
    });

    const tokenResponse = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: tokenParams.toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Fitbit token exchange failed:', errorText);
      return Response.redirect('https://fitloot.lovable.app/settings?error=token_exchange_failed');
    }

    const tokenData = await tokenResponse.json();

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    const connectionData = {
      user_id: userId,
      provider: 'fitbit',
      provider_user_id: tokenData.user_id || null,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_expires_at: expiresAt,
      scopes: tokenData.scope ? tokenData.scope.split(' ') : null,
      is_active: true,
      updated_at: new Date().toISOString()
    };

    const { error: dbError } = await supabaseClient
      .from('wearable_connections')
      .upsert(connectionData, { onConflict: 'user_id,provider' });

    if (dbError) {
      console.error('Database error:', dbError);
      return Response.redirect('https://fitloot.lovable.app/settings?error=database_error');
    }

    // Clean up OAuth state
    await supabaseClient
      .from('oauth_states')
      .delete()
      .eq('state', state);

    return Response.redirect('https://fitloot.lovable.app/settings?success=fitbit_connected');

  } catch (err: any) {
    console.error('Fitbit callback error:', err);
    return Response.redirect('https://fitloot.lovable.app/settings?error=internal_error');
  }
});
