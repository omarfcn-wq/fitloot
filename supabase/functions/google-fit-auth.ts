// Supabase Edge Function: supabase/functions/google-fit-auth/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const { userId, redirectUrl } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Google Fit OAuth 2.0 configuration
    const googleConfig = {
      clientId: '815879431098-tuano0duu5dqjt94eevbd3tourvi69oa.apps.googleusercontent.com',
      clientSecret: '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',
      redirectUri: 'https://fitloot.lovable.app/api/auth/google-fit/callback',
      scope: 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/fitness.location.read',
      responseType: 'code',
      authUrl: 'https://accounts.google.com/o/oauth2/auth'
    };

    // Generate state parameter for security
    const state = crypto.randomUUID();
    
    // Store state in database for verification later
    const { error: stateError } = await supabaseClient
      .from('oauth_states')
      .insert({
        state,
        user_id: userId,
        provider: 'google_fit',
        redirect_url: redirectUrl,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      });

    if (stateError) {
      console.error('Error storing OAuth state:', stateError);
      throw new Error('Failed to initiate OAuth flow');
    }

    // Build Google authorization URL
    const authParams = new URLSearchParams({
      client_id: googleConfig.clientId,
      response_type: googleConfig.responseType,
      redirect_uri: googleConfig.redirectUri,
      scope: googleConfig.scope,
      state: state,
      access_type: 'offline', // To get refresh token
      prompt: 'consent' // Force consent screen to ensure refresh token
    });

    const authUrl = ${googleConfig.authUrl}?${authParams.toString()};

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
    console.error('Google Fit auth error:', error);
    
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
