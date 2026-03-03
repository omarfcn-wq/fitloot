// Supabase Edge Function: supabase/functions/fitbit-auth/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, redirectUrl } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Fitbit OAuth 2.0 configuration
    const fitbitConfig = {
      clientId: '23V32S',
      clientSecret: '326f023f9d3b452d371f795a9aeac237',
      redirectUri: 'https://fitloot.lovable.app/api/auth/fitbit/callback',
      scope: 'activity heartrate profile sleep weight',
      responseType: 'code',
      authUrl: 'https://www.fitbit.com/oauth2/authorize'
    };

    // Generate state parameter for security (CSRF protection)
    const state = crypto.randomUUID();
    
    // Store state in database for verification later
    const { error: stateError } = await supabaseClient
      .from('oauth_states')
      .insert({
        state,
        user_id: userId,
        provider: 'fitbit',
        redirect_url: redirectUrl,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      });

    if (stateError) {
      console.error('Error storing OAuth state:', stateError);
      throw new Error('Failed to initiate OAuth flow');
    }

    // Build Fitbit authorization URL
    const authParams = new URLSearchParams({
      client_id: fitbitConfig.clientId,
      response_type: fitbitConfig.responseType,
      redirect_uri: fitbitConfig.redirectUri,
      scope: fitbitConfig.scope,
      state: state
    });

    const authUrl = ${fitbitConfig.authUrl}?${authParams.toString()};

    return new Response(
      JSON.stringify({
        success: true,
        authUrl,
        state
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error: any) {
    console.error('Fitbit auth error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
