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

    const { userId, redirectUrl } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    const clientId = Deno.env.get('GOOGLE_FIT_CLIENT_ID') ?? '';
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-fit-callback`;

    const state = crypto.randomUUID();

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

    const authParams = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/fitness.location.read',
      state: state,
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `https://accounts.google.com/o/oauth2/auth?${authParams.toString()}`;

    return new Response(
      JSON.stringify({ success: true, authUrl, state }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Google Fit auth error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
